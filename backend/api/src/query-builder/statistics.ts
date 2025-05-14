import { Kysely, SelectQueryBuilder } from 'kysely';
import { Database } from 'src/db/types';
import {
  BarChartCohortDefinition,
  BoxPlotCountBy,
  CohortDefinition,
} from 'src/types/type';
import {
  buildBaseQuery,
  ExecutableBuilder,
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleFilter,
  handleNumberWithOperator,
} from './base';

export const buildQuery = (
  db: Kysely<Database>,
  cohortDef: CohortDefinition,
  options: {
    cohortId?: string; // cohortId와 personId는 둘 중 하나만 사용해야 함
    personId?: string;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { cohortId, personId, database } = options;
  database = database || 'clickhouse';

  if (cohortId) {
    return buildBaseQuery(db, database, cohortDef, true, cohortId);
  }
  if (personId) {
    // personId가 있는 경우 cohortDef에서 initialGroup, comparisonGroup을 사용하지 않음
    const { queries, cleanupQueries } = buildBaseQuery(
      db,
      database,
      {
        ...cohortDef,
        initialGroup: {
          containers: [] as any,
        },
        comparisonGroup: undefined,
      },
      true,
    );
    queries.push(
      db
        .insertInto('temp_cohort_detail')
        .expression(
          db.selectNoFrom(({ eb }) => [
            eb.val(1).as('cohort_id'),
            eb.fn<any>('_to_int64', [eb.val(personId)]).as('person_id'),
          ]),
        ),
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
    chartCohortDef: BarChartCohortDefinition;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { chartCohortDef, database } = options;
  database = database || 'clickhouse';

  const { queries, cleanupQueries, containerCount } = buildQuery(
    db,
    options.chartCohortDef,
    options,
  ); // 필터 처리 완료

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

export const buildBoxPlotQuery = (
  db: Kysely<Database>,
  options: {
    cohortId?: string; // cohortId와 personId는 둘 중 하나만 사용해야 함
    personId?: string;
    cohortDef: CohortDefinition;
    countBy: BoxPlotCountBy;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { cohortDef, database, countBy } = options;
  database = database || 'clickhouse';

  const { queries, cleanupQueries, containerCount } = buildQuery(
    db,
    cohortDef,
    options,
  ); // 필터 처리 완료

  let measurementQuery: SelectQueryBuilder<Database, any, any> = db
    .selectFrom('measurement')
    .select('value_as_number')
    .where('person_id', 'in', ({ eb }) =>
      eb
        .selectFrom('temp_cohort_detail')
        .select('person_id')
        .where('cohort_id', '=', ({ eb }) => eb.val<any>(containerCount)),
    );

  if (countBy.age) {
    measurementQuery = handleAgeWithNumberOperator(
      measurementQuery.leftJoin(
        'person',
        'measurement.person_id',
        'person.person_id',
      ),
      'measurement.measurement_date',
      'person.year_of_birth',
      countBy.age,
    );
  }

  if (countBy.concept) {
    measurementQuery = measurementQuery.where(
      'measurement.measurement_concept_id',
      '=',
      ({ eb }) => eb.fn('_to_int64', [eb.val(countBy.concept)]),
    );
  }

  if (countBy.date) {
    measurementQuery = handleDateWithOperator(
      measurementQuery,
      'measurement.measurement_date',
      countBy.date,
    );
  }

  if (countBy.value) {
    measurementQuery = handleNumberWithOperator(
      measurementQuery,
      'value_as_number',
      countBy.value,
    );
  }

  const finalQueries: ExecutableBuilder[] = [];

  finalQueries.push(
    db
      .with('measurement_tmp', () => measurementQuery)
      .selectFrom('measurement_tmp')
      .select(({ eb }) => [
        eb.val<string>('maximum').as('type'),
        eb.fn<number>('_maximum', [eb.ref('value_as_number')]).as('value'),
      ])
      .union((qb) =>
        qb
          .selectFrom('measurement_tmp')
          .select(({ eb }) => [
            eb.val<string>('upper').as('type'),
            eb
              .fn<number>('_upper_quartile', [eb.ref('value_as_number')])
              .as('value'),
          ]),
      )
      .union((qb) =>
        qb
          .selectFrom('measurement_tmp')
          .select(({ eb }) => [
            eb.val<string>('median').as('type'),
            eb.fn<number>('_median', [eb.ref('value_as_number')]).as('value'),
          ]),
      )
      .union((qb) =>
        qb
          .selectFrom('measurement_tmp')
          .select(({ eb }) => [
            eb.val<string>('lower').as('type'),
            eb
              .fn<number>('_lower_quartile', [eb.ref('value_as_number')])
              .as('value'),
          ]),
      )
      .union((qb) =>
        qb
          .selectFrom('measurement_tmp')
          .select(({ eb }) => [
            eb.val<string>('minimum').as('type'),
            eb.fn<number>('_minimum', [eb.ref('value_as_number')]).as('value'),
          ]),
      )
      .union((qb) =>
        qb
          .selectFrom('measurement_tmp')
          .select(({ eb }) => [
            eb.val<string>('outlier').as('type'),
            eb.ref('value_as_number').as('value'),
          ])
          .where('value_as_number', 'is not', null)
          .where((eb) =>
            eb.or([
              eb(
                'value_as_number',
                '>',
                qb
                  .selectFrom('measurement_tmp')
                  .select(
                    eb.fn('_maximum', [eb.ref('value_as_number')]).as('value'),
                  ),
              ),
              eb(
                'value_as_number',
                '<',
                qb
                  .selectFrom('measurement_tmp')
                  .select(
                    eb.fn('_minimum', [eb.ref('value_as_number')]).as('value'),
                  ),
              ),
            ]),
          ),
      ),
  );

  queries.push(finalQueries);

  return [...queries, ...cleanupQueries];
};
