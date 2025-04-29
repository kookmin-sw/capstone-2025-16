import { Injectable, NotFoundException } from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import { CohortDefinition } from '../types/type';
import { uuidv7 } from 'uuidv7';
import { buildQuery } from '../query-builder';
import * as moment from 'moment';
import {
  CohortResponse,
  CohortStatisticsResponse,
  CreateCohortResponse,
  UpdateCohortResponse,
  DeleteCohortResponse,
} from './dto/cohort.dto';

@Injectable()
export class CohortService {
  async getCohorts(page: number = 0): Promise<CohortResponse[]> {
    const limit = 50;

    return await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .limit(limit)
      .offset(page * limit)
      .execute();
  }

  async getCohortStatistics(id: string): Promise<CohortStatisticsResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    const [gender, mortality, age] = await Promise.all([
      getBaseDB() // gender
        .selectFrom('cohort_detail')
        .where('cohort_id', '=', id)
        .leftJoin('person', 'person.person_id', 'cohort_detail.person_id')
        .leftJoin('concept', 'concept.concept_id', 'person.gender_concept_id')
        .groupBy(['concept.concept_id', 'concept.concept_name'])
        .select(({ fn }) => [
          'concept.concept_id',
          'concept.concept_name',
          fn.count('person.person_id').as('count'),
        ])
        .execute(),
      getBaseDB() // mortality
        .selectFrom('cohort_detail')
        .where('cohort_id', '=', id)
        .leftJoin('death', 'death.person_id', 'cohort_detail.person_id')
        .select(({ eb, fn }) => [
          eb(
            fn.count('cohort_detail.person_id'),
            '-',
            fn.count('death.person_id'),
          ).as('alive'),
          fn.count('death.person_id').as('deceased'),
        ])
        .executeTakeFirst(),
      getBaseDB() // age
        .selectFrom(
          getBaseDB()
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .leftJoin('person', 'person.person_id', 'cohort_detail.person_id')
            .select(({ eb, fn }) => [
              eb(
                eb.ref('person.year_of_birth'),
                '-',
                eb.fn<number>('_get_year', [eb.fn('now')]),
              ).as('age'),
            ])
            .as('tmp'),
        )
        .groupBy(({ eb, fn }) => [fn('floor', [eb(eb.ref('age'), '/', 10)])])
        .select(({ eb, fn }) => [
          eb(fn('floor', [eb(eb.ref('age'), '/', 10)]), '*', 10).as(
            'age_start',
          ),
          eb(eb(fn('floor', [eb(eb.ref('age'), '/', 10)]), '*', 10), '+', 9).as(
            'age_end',
          ),
          fn.count('age').as('count'),
        ])
        .execute(),
    ]);

    age.sort((a, b) => Number(a.age_start) - Number(b.age_start));
    const age_range: { [key: string]: number } = {};
    for (const { age_start, age_end, count } of age) {
      age_range[`${age_start}-${age_end}`] = Number(count);
    }

    return {
      gender: gender.map((e) => ({
        concept_id: e.concept_id || '',
        concept_name: e.concept_name || '',
        count: Number(e.count),
      })),
      mortality: {
        alive: Number(mortality?.alive ?? 0),
        deceased: Number(mortality?.deceased ?? 0),
      },
      age: age_range,
    };
  }

  async getCohort(id: string): Promise<CohortResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    return cohort;
  }

  async getCohortPersons(id: string, page: number = 0): Promise<string[]> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .select('cohort_id')
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    const limit = 50;

    const cohortDetail = await getBaseDB()
      .selectFrom('cohort_detail')
      .select('person_id')
      .where('cohort_id', '=', id)
      .limit(limit)
      .offset(page * limit)
      .execute();

    return cohortDetail.map((e) => e.person_id);
  }

  async createNewCohort(
    name: string,
    description: string,
    cohortDef: CohortDefinition,
    temporary?: boolean,
  ): Promise<CreateCohortResponse> {
    let cohortId: string | undefined;
    if (!temporary) {
      cohortId = uuidv7();
      await getBaseDB()
        .insertInto('cohort')
        .values({
          cohort_id: cohortId,
          name: name,
          description: description,
          cohort_definition: JSON.stringify(cohortDef),
          author: '00000000-0000-0000-0000-000000000000', // TODO: add author
          created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
          updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        })
        .execute();
    }

    let containerCounts: number[] = [];
    if (cohortDef) {
      await getBaseDB()
        .connection()
        .execute(async (db) => {
          const queries = buildQuery(db, {
            cohortId,
            cohortDef,
            database: process.env.DB_TYPE,
          });

          for (const query of queries.flat()) {
            const result = await query.execute();
            if ('select' in query) {
              // container person counts
              containerCounts = Array(
                cohortDef.initialGroup.containers.length +
                  (cohortDef.comparisonGroup?.containers.length ?? 0),
              ).fill(0);

              for (const { container_id, count } of result as {
                container_id: string;
                count: string;
              }[]) {
                containerCounts[Number.parseInt(container_id) - 1] =
                  Number.parseInt(count);
              }
            }
          }
        });
    }

    return {
      message: 'Cohort successfully created.',
      cohortId,
      containerCounts,
    };
  }

  async updateExistingCohort(
    cohortId: string,
    name?: string,
    description?: string,
    cohortDef?: CohortDefinition,
  ): Promise<UpdateCohortResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .where('cohort_id', '=', cohortId)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    await getBaseDB()
      .updateTable('cohort')
      .set({
        name: name ?? cohort.name,
        description: description ?? cohort.description,
        cohort_definition: cohortDef
          ? JSON.stringify(cohortDef)
          : cohort.cohort_definition,
        updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      })
      .where('cohort_id', '=', cohortId)
      .execute();

    return {
      message: 'Cohort successfully updated.',
    };
  }

  async removeExistingCohort(id: string): Promise<DeleteCohortResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    await getBaseDB()
      .deleteFrom('cohort_detail')
      .where('cohort_id', '=', id)
      .execute();

    await getBaseDB()
      .deleteFrom('cohort_concept')
      .where('cohort_id', '=', id)
      .execute();

    await getBaseDB()
      .deleteFrom('cohort')
      .where('cohort_id', '=', id)
      .execute();

    return {
      message: 'Cohort successfully deleted.',
    };
  }
}
