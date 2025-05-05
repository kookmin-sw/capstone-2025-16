import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from 'src/db/types';
import { ChartCohortDefinition } from 'src/types/type';
import {
  buildBaseQuery,
  ExecutableBuilder,
  getBaseDB,
  handleFilter,
} from './base';

export const buildQuery = (
  db: Kysely<Database>,
  options: {
    cohortId?: string; // cohortId와 personId는 둘 중 하나만 사용해야 함
    personId?: string;
    chartCohortDef: ChartCohortDefinition;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { cohortId, personId, chartCohortDef, database } = options;
  database = database || 'clickhouse';

  if (cohortId) {
    return buildBaseQuery(db, database, chartCohortDef, true, cohortId);
  }
  if (personId) {
    // personId가 있는 경우 chartCohortDef에서 initialGroup, comparisonGroup을 사용하지 않음
    const { queries, cleanupQueries } = buildBaseQuery(
      db,
      database,
      {
        ...chartCohortDef,
        initialGroup: {
          containers: [] as any,
        },
        comparisonGroup: undefined,
      },
      true,
    );
    queries.push(
      db.insertInto('temp_cohort_detail').values(({ eb }) => ({
        person_id: eb.fn<any>('_to_int64', [eb.val(personId)]),
        cohort_id: eb.val<any>(1),
      })),
    );
    return { queries, cleanupQueries, containerCount: 1 };
  }
  throw new Error('cohortId or personId is required');
};

export const buildBarChartQuery = (
  db: Kysely<Database>,
  options: {
    cohortId?: string; // cohortId와 personId는 둘 중 하나만 사용해야 함
    personId?: string;
    chartCohortDef: ChartCohortDefinition;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { cohortId, personId, chartCohortDef, database } = options;
  database = database || 'clickhouse';

  const { queries, cleanupQueries, containerCount } = buildQuery(db, options); // 필터 처리 완료

  const finalQueries: ExecutableBuilder[] = [];

  if (!chartCohortDef.data) {
    finalQueries.push(
      db
        .selectFrom('temp_cohort_detail')
        .select(({ fn }) => fn.count('person_id').as('count'))
        .where('cohort_id', '=', ({ eb }) => eb.val<any>(containerCount)),
    );
  } else {
    let query: SelectQueryBuilder<Database, any, any> = handleFilter(
      db,
      chartCohortDef.data,
      false,
    );
    query = query.intersectAll(
      db
        .selectFrom('temp_cohort_detail')
        .select('person_id')
        .where('cohort_id', '=', ({ eb }) => eb.val<any>(containerCount)),
    );
    finalQueries.push(
      db
        .selectFrom(query.as('tmp'))
        .select(({ fn }) => fn.count('person_id').as('count')),
    );
  }

  queries.push(finalQueries);

  return [...queries, ...cleanupQueries];
};
