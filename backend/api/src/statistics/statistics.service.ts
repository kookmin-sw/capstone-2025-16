import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import { uuidv7 } from 'uuidv7';
import * as moment from 'moment';
import {
  CreateStatisticsDto,
  UpdateStatisticsDto,
  StatisticsResponse,
  StatisticsListResponse,
  CreateStatisticsResponse,
  UpdateStatisticsResponse,
  DeleteStatisticsResponse,
} from './dto/statistics.dto';
import {
  BarChartCohortDefinition,
  BoxPlotCountBy,
  CohortDefinition,
} from 'src/types/type';
import { buildBarChartQuery } from 'src/query-builder';
import { buildBoxPlotQuery } from 'src/query-builder/statistics';

@Injectable()
export class StatisticsService {
  async getStatistics(
    page: number = 0,
    limit: number = 50,
  ): Promise<StatisticsListResponse> {
    const offset = page * limit;

    // 통계 목록 조회 쿼리
    const statisticsQuery = getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .limit(limit)
      .offset(offset)
      .orderBy('updated_at', 'desc');

    // 총 결과 수를 계산하기 위한 쿼리
    const countQuery = getBaseDB()
      .selectFrom('statistics')
      .select(({ fn }) => [fn.count('statistics_id').as('total')]);

    // 두 쿼리를 병렬로 실행
    const [statistics, countResult] = await Promise.all([
      statisticsQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      statistics,
      total: Number(countResult?.total || 0),
      page,
      limit,
    };
  }

  async getStatisticsById(id: string): Promise<StatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    return statistics;
  }

  async executeBarChart(
    id: { cohortId?: string; personId?: string },
    chartCohortDefs: BarChartCohortDefinition[],
  ) {
    let values: number[] = [];
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        for (let chartCohortDef of chartCohortDefs) {
          let queries = buildBarChartQuery(db, {
            ...id,
            chartCohortDef,
          });
          for (let query of queries.flat()) {
            const result = await query.execute();
            if ('select' in query) {
              let cnt = (
                result as {
                  count: number;
                }[]
              ).at(0)?.count;
              values.push(Number(cnt || 0));
            }
          }
        }
      });
    return values;
  }

  async processBarChart(options: {
    cohortIds?: string[];
    personId?: string;
    chartCohortDefs: BarChartCohortDefinition[];
  }) {
    let { cohortIds, personId, chartCohortDefs } = options;
    let result: {
      cohortId?: string;
      personId?: string;
      values: number[];
    }[] = [];

    if (cohortIds) {
      for (const cohortId of cohortIds) {
        const values = await this.executeBarChart(
          { cohortId },
          chartCohortDefs,
        );
        result.push({ cohortId, values });
      }
    } else if (personId) {
      const values = await this.executeBarChart({ personId }, chartCohortDefs);
      result.push({ personId, values });
    } else {
      throw new BadRequestException(
        'Either cohortIds or personId must be provided.',
      );
    }

    return result;
  }

  async executeBoxPlotChart(
    id: { cohortId?: string; personId?: string },
    chartCohortDefs: CohortDefinition[],
    countBy: BoxPlotCountBy,
  ) {
    let values: {
      type: string;
      value: number;
    }[][] = [];
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        for (let chartCohortDef of chartCohortDefs) {
          let queries = buildBoxPlotQuery(db, {
            ...id,
            cohortDef: chartCohortDef,
            countBy: countBy,
            database: process.env.DB_TYPE,
          });
          for (let query of queries.flat()) {
            const result = await query.execute();
            if ('select' in query) {
              values.push(
                (result as { type: string; value: number }[]).map(
                  ({ type, value }) => ({ type, value: Number(value) }),
                ),
              );
            }
          }
        }
      });
    return values;
  }

  async processBoxPlotChart(options: {
    cohortIds?: string[];
    personId?: string;
    chartCohortDefs: CohortDefinition[];
    countBy: BoxPlotCountBy;
  }) {
    let { cohortIds, personId, chartCohortDefs, countBy } = options;
    let result: {
      cohortId?: string;
      personId?: string;
      values: {
        type: string;
        value: number;
      }[][];
    }[] = [];

    if (cohortIds) {
      for (const cohortId of cohortIds) {
        const values = await this.executeBoxPlotChart(
          { cohortId },
          chartCohortDefs,
          countBy,
        );
        result.push({ cohortId, values });
      }
    } else if (personId) {
      const values = await this.executeBoxPlotChart(
        { personId },
        chartCohortDefs,
        countBy,
      );
      result.push({ personId, values });
    } else {
      throw new BadRequestException(
        'Either cohortIds or personId must be provided.',
      );
    }

    return result;
  }

  async createStatistics(
    createStatisticsDto: CreateStatisticsDto,
  ): Promise<CreateStatisticsResponse> {
    const statisticsId = uuidv7();
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    // DTO에서 필요한 필드 추출
    const { name, description, type, cohortIds, personId, groups, countBy } =
      createStatisticsDto;

    let result: any;
    switch (type) {
      case 'bar':
        result = await this.processBarChart({
          cohortIds,
          personId,
          chartCohortDefs: groups,
        });
        break;
      case 'boxplot':
        if (!countBy) {
          throw new BadRequestException(
            'countBy is required for boxplot type.',
          );
        }

        result = await this.processBoxPlotChart({
          cohortIds,
          personId,
          chartCohortDefs: groups,
          countBy,
        });
        break;
      default:
        throw new BadRequestException(
          'Invalid type. Only "bar" and "boxplot" are supported.',
        );
    }

    // 데이터베이스에 저장할 definition 객체 생성
    const definition = {
      cohortIds,
      personId,
      groups,
      countBy,
    };

    await getBaseDB()
      .insertInto('statistics')
      .values({
        statistics_id: statisticsId,
        name,
        description,
        type,
        definition: JSON.stringify(definition),
        result: JSON.stringify(result),
        author: '00000000-0000-0000-0000-000000000000', // TODO: add author
        created_at: now,
        updated_at: now,
      })
      .execute();

    return {
      message: 'Statistics created successfully',
      statisticsId,
    };
  }

  async updateStatistics(
    id: string,
    updateStatisticsDto: UpdateStatisticsDto,
  ): Promise<UpdateStatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, any> = {
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    // 현재 저장된 데이터
    const currentDefinition = JSON.parse(statistics.definition || '{}');
    let definitionUpdated = false;
    let resultNeedsUpdate = false;

    // 이름과 설명 업데이트 (결과에 영향 없음)
    if (updateStatisticsDto.name !== undefined) {
      updateFields.name = updateStatisticsDto.name;
    }

    if (updateStatisticsDto.description !== undefined) {
      updateFields.description = updateStatisticsDto.description;
    }

    // 타입 변경 시 결과 재계산 필요
    if (updateStatisticsDto.type !== undefined) {
      updateFields.type = updateStatisticsDto.type;
      resultNeedsUpdate = true;
    }

    // DTO에서 필드가 변경되었으면 정의 업데이트 및 결과 재계산 플래그 설정
    if (updateStatisticsDto.cohortIds !== undefined) {
      currentDefinition.cohortIds = updateStatisticsDto.cohortIds;
      definitionUpdated = true;
      resultNeedsUpdate = true;
    }

    if (updateStatisticsDto.personId !== undefined) {
      currentDefinition.personId = updateStatisticsDto.personId;
      definitionUpdated = true;
      resultNeedsUpdate = true;
    }

    if (updateStatisticsDto.groups !== undefined) {
      currentDefinition.groups = updateStatisticsDto.groups;
      definitionUpdated = true;
      resultNeedsUpdate = true;
    }

    if (updateStatisticsDto.countBy !== undefined) {
      currentDefinition.countBy = updateStatisticsDto.countBy;
      definitionUpdated = true;
      resultNeedsUpdate = true;
    }

    if (definitionUpdated) {
      updateFields.definition = JSON.stringify(currentDefinition);
    }

    // 결과 데이터를 갱신해야 하는 경우
    if (resultNeedsUpdate) {
      const type = updateStatisticsDto.type || statistics.type;
      const cohortIds = currentDefinition.cohortIds;
      const personId = currentDefinition.personId;
      const groups = currentDefinition.groups;
      const countBy = currentDefinition.countBy;

      let result: any;
      switch (type) {
        case 'bar':
          result = await this.processBarChart({
            cohortIds,
            personId,
            chartCohortDefs: groups,
          });
          break;
        case 'boxplot':
          if (!countBy) {
            throw new BadRequestException(
              'countBy is required for boxplot type.',
            );
          }

          result = await this.processBoxPlotChart({
            cohortIds,
            personId,
            chartCohortDefs: groups,
            countBy,
          });
          break;
        default:
          throw new BadRequestException(
            'Invalid type. Only "bar" and "boxplot" are supported.',
          );
      }

      updateFields.result = JSON.stringify(result);
    }

    // 데이터베이스 업데이트
    await getBaseDB()
      .updateTable('statistics')
      .set(updateFields)
      .where('statistics_id', '=', id)
      .execute();

    return {
      message: 'Statistics updated successfully',
    };
  }

  async deleteStatistics(id: string): Promise<DeleteStatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    await getBaseDB()
      .deleteFrom('statistics')
      .where('statistics_id', '=', id)
      .execute();

    return {
      message: 'Statistics deleted successfully',
    };
  }
}
