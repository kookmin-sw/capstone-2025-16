import { Injectable, NotFoundException } from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import { CohortDefinition } from '../types/type';
import { uuidv7 } from 'uuidv7';
import { buildCreateCohortQuery } from '../query-builder';
import * as moment from 'moment';
import {
  CohortResponse,
  CohortStatisticsResponse,
  CreateCohortResponse,
  UpdateCohortResponse,
  DeleteCohortResponse,
  CohortListResponse,
  CohortPersonsResponse,
  CohortDetailResponse,
} from './dto/cohort.dto';

@Injectable()
export class CohortService {
  async getCohorts(
    page: number = 0,
    limit: number = 50,
  ): Promise<CohortListResponse> {
    const offset = page * limit;

    // 코호트 목록 조회 쿼리
    const cohortsQuery = getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .limit(limit)
      .offset(offset)
      .orderBy('updated_at', 'desc');

    // 총 결과 수를 계산하기 위한 쿼리
    const countQuery = getBaseDB()
      .selectFrom('cohort')
      .select(({ fn }) => [fn.count('cohort_id').as('total')]);

    // 두 쿼리를 병렬로 실행
    const [cohorts, countResult] = await Promise.all([
      cohortsQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      cohorts,
      total: Number(countResult?.total || 0),
      page,
      limit,
    };
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

    const [
      gender,
      mortality,
      age,
      visitTypes,
      visitCounts,
      topTenDrugs,
      topTenConditions,
      topTenProcedures,
      topTenMeasurements,
    ] = await Promise.all([
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
      getBaseDB()
        .selectFrom('visit_occurrence')
        .where('person_id', 'in', (eb) =>
          eb
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .select('person_id'),
        )
        .leftJoin('concept', 'visit_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .execute(),
      getBaseDB()
        .selectFrom(
          getBaseDB()
            .selectFrom('visit_occurrence')
            .where('person_id', 'in', (eb) =>
              eb
                .selectFrom('cohort_detail')
                .where('cohort_id', '=', id)
                .select('person_id'),
            )
            .groupBy('person_id')
            .select(({ fn }) => fn.count('person_id').as('cnt'))
            .as('tmp'),
        )
        .groupBy('cnt')
        .select(({ fn }) => ['cnt', fn.count('cnt').as('cnt_cnt')])
        .execute(),
      getBaseDB()
        .selectFrom('drug_exposure')
        .where('person_id', 'in', (eb) =>
          eb
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .select('person_id'),
        )
        .leftJoin('concept', 'drug_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('condition_occurrence')
        .where('person_id', 'in', (eb) =>
          eb
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .select('person_id'),
        )
        .leftJoin('concept', 'condition_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('procedure_occurrence')
        .where('person_id', 'in', (eb) =>
          eb
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .select('person_id'),
        )
        .leftJoin('concept', 'procedure_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('measurement')
        .where('person_id', 'in', (eb) =>
          eb
            .selectFrom('cohort_detail')
            .where('cohort_id', '=', id)
            .select('person_id'),
        )
        .leftJoin('concept', 'measurement_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
    ]);

    age.sort((a, b) => Number(a.age_start) - Number(b.age_start));
    const age_range: { [age_range: string]: number } = {};
    for (const { age_start, age_end, count } of age) {
      age_range[`${age_start}-${age_end}`] = Number(count);
    }
    const visitType: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of visitTypes) {
      visitType[concept_name ?? 'Unknown Visit Type'] = Number(count);
    }
    const visitCount: { [count: string]: number } = {};
    for (const { cnt, cnt_cnt } of visitCounts) {
      visitCount[cnt.toString()] = Number(cnt_cnt);
    }
    const topTenDrug: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenDrugs) {
      topTenDrug[concept_name ?? 'Unknown Drug'] = Number(count);
    }
    const topTenCondition: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenConditions) {
      topTenCondition[concept_name ?? 'Unknown Condition'] = Number(count);
    }
    const topTenProcedure: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenProcedures) {
      topTenProcedure[concept_name ?? 'Unknown Procedure'] = Number(count);
    }
    const topTenMeasurement: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenMeasurements) {
      topTenMeasurement[concept_name ?? 'Unknown Measurement'] = Number(count);
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
      visitType,
      visitCount,
      topTenDrug,
      topTenCondition,
      topTenProcedure,
      topTenMeasurement,
    };
  }

  async getCohort(id: string): Promise<CohortDetailResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .selectAll()
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    const count = await getBaseDB()
      .selectFrom('cohort_detail')
      .select(({ fn }) => [fn.count('person_id').as('count')])
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    return { ...cohort, count: Number(count?.count || 0) };
  }

  async getCohortPersons(
    id: string,
    page: number = 0,
    limit: number = 50,
  ): Promise<CohortPersonsResponse> {
    const cohort = await getBaseDB()
      .selectFrom('cohort')
      .select('cohort_id')
      .where('cohort_id', '=', id)
      .executeTakeFirst();

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    // 특정 코호트에 포함된 person_id 목록을 조회하는 쿼리
    const personsQuery = getBaseDB()
      .selectFrom('cohort_detail')
      .select('person_id')
      .where('cohort_id', '=', id)
      .limit(limit)
      .offset(page * limit);

    // 총 인원 수를 계산하기 위한 쿼리
    const countQuery = getBaseDB()
      .selectFrom('cohort_detail')
      .select(({ fn }) => [fn.count('person_id').as('total')])
      .where('cohort_id', '=', id);

    // 두 쿼리를 병렬로 실행
    const [persons, countResult] = await Promise.all([
      personsQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      persons: persons.map((e) => e.person_id),
      total: Number(countResult?.total || 0),
      page,
      limit,
    };
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
          const queries = buildCreateCohortQuery(db, {
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
