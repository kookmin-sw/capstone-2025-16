import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { connect, StringCodec } from 'nats';
import { getBaseDB } from '../query-builder/base';
import { FeatureStatusResponseDto } from './dto/feature.dto';

@Injectable()
export class FeatureService {
  async isStatusPending(cohortId: string): Promise<boolean> {
    const natsUrl = process.env.NATS_URL;
    const natsUser = process.env.NATS_USER;
    const natsPass = process.env.NATS_PASS;
    const streamName = process.env.NATS_STREAM_NAME;
    const durableName = process.env.NATS_DURABLE_NAME;
    if (!natsUrl || !natsUser || !natsPass || !streamName || !durableName) {
      throw new InternalServerErrorException('Missing NATS configuration');
    }

    const nc = await connect({
      servers: natsUrl,
      user: natsUser,
      pass: natsPass,
    });
    try {
      const jsm = await nc.jetstreamManager();

      // Get stream info
      const streamInfo = await jsm.streams.info(streamName);

      // Check if stream has any messages
      if (streamInfo.state.messages > 0) {
        const { first_seq, last_seq } = streamInfo.state;

        // Determine start sequence - default to first_seq
        let startSeq = first_seq;

        // Get consumer info to check which messages have been acknowledged
        try {
          const consumerInfo = await jsm.consumers.info(
            streamName,
            durableName,
          );
          // If we have consumer info and ack_floor, start from the next message after the ack floor
          if (
            consumerInfo &&
            consumerInfo.ack_floor &&
            consumerInfo.ack_floor.stream_seq
          ) {
            startSeq = consumerInfo.ack_floor.stream_seq + 1;
          }
        } catch (consumerError) {
          // Consumer might not exist yet, which is fine - we'll start from first_seq
          console.log(
            'Consumer not found or other error:',
            consumerError.message,
          );
        }

        const sc = StringCodec();

        // Check only unprocessed messages
        for (let seq = startSeq; seq <= last_seq; seq++) {
          try {
            // Get message directly from stream by sequence number
            const msg = await jsm.streams.getMessage(streamName, {
              seq,
            });

            // Decode and parse the message
            const msgData = sc.decode(msg.data);
            const parsedData = JSON.parse(msgData);

            // Check if this message is for our cohort
            if (parsedData.cohort_id === cohortId) {
              return true;
            }
          } catch (msgError) {
            // Skip messages that can't be retrieved
            console.error('Error retrieving message:', msgError);
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error checking stream:', error);
      // Don't rethrow as this is an internal check and we want to continue even if this fails
    } finally {
      await nc.close();
    }

    return false;
  }

  async getFeatureStatus(
    cohortId: string,
    page: number = 0,
    limit: number = 100,
  ): Promise<FeatureStatusResponseDto> {
    try {
      const featureApis = process.env.FEATURE_APIS?.split(',');
      if (!featureApis) {
        throw new InternalServerErrorException(
          'Missing FEATURE_APIS configuration',
        );
      }

      const apiRequests = featureApis.map((api) => {
        // Use fetch to get status from root endpoint
        return fetch(`http://${api}/`, {
          signal: AbortSignal.timeout(5000),
        })
          .then((res) => res.json())
          .catch(() => ({ status: 'unknown' }));
      });

      const responses = await Promise.all(apiRequests);

      // Check if any API reports the cohort as 'running' with our cohort_id
      for (const response of responses) {
        if (
          response?.status === 'running' &&
          response?.cohort_id === cohortId
        ) {
          return {
            cohort_id: cohortId,
            status: 'running',
          };
        }
      }

      // Check if the job is pending in NATS queue
      const isPending = await this.isStatusPending(cohortId);
      if (isPending) {
        return {
          cohort_id: cohortId,
          status: 'pending',
        };
      }

      // If not running or pending, retrieve from database
      return this.getFeatureExtractions(cohortId, page, limit);
    } catch (error) {
      console.error('Error checking feature status:', error);
      throw error;
    }
  }

  private async getFeatureExtractions(
    cohortId: string,
    page: number = 0,
    limit: number = 100,
  ): Promise<FeatureStatusResponseDto> {
    const offset = page * limit;

    // Check if features exist for this cohort
    const featuresQuery = getBaseDB()
      .selectFrom('feature_extraction')
      .where('cohort_id', '=', cohortId)
      .selectAll('feature_extraction')
      .leftJoin(
        'concept',
        'feature_extraction.concept_id',
        'concept.concept_id',
      )
      .select('concept.concept_name')
      .limit(limit)
      .offset(offset)
      .orderBy('rank');

    // Count total features
    const countQuery = getBaseDB()
      .selectFrom('feature_extraction')
      .where('cohort_id', '=', cohortId)
      .select(({ fn }) => [fn.count('concept_id').as('total')]);

    // Execute queries in parallel
    const [features, countResult] = await Promise.all([
      featuresQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(countResult?.total || 0);

    return {
      cohort_id: cohortId,
      status: 'completed',
      features: {
        features,
        total,
        page,
        limit,
      },
    };
  }

  async requestFeatureExtraction(cohortId: string, k: number): Promise<void> {
    // Connect to NATS
    const natsUrl = process.env.NATS_URL;
    const natsUser = process.env.NATS_USER;
    const natsPass = process.env.NATS_PASS;
    const streamName = process.env.NATS_STREAM_NAME;
    const subject = process.env.NATS_SUBJECT;

    if (!natsUrl || !natsUser || !natsPass || !streamName || !subject) {
      throw new Error('Missing NATS configuration');
    }

    const nc = await connect({
      servers: natsUrl,
      user: natsUser,
      pass: natsPass,
    });
    const js = nc.jetstream();
    const sc = StringCodec();

    // Prepare message for feature extraction
    const message = JSON.stringify({
      cohort_id: cohortId,
      k,
    });

    // Create stream if not exists
    try {
      const jsm = await nc.jetstreamManager();
      await jsm.streams.info(streamName);
    } catch (error) {
      const jsm = await nc.jetstreamManager();
      await jsm.streams.add({ name: streamName, subjects: [subject] });
    }

    // Publish message
    await js.publish(subject, sc.encode(message));

    // Close connection
    await nc.close();
  }

  async deleteFeatureExtractions(cohortId: string): Promise<void> {
    await getBaseDB()
      .deleteFrom('feature_extraction')
      .where('cohort_id', '=', cohortId)
      .execute();
  }
}
