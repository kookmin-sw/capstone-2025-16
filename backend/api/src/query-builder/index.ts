import * as conditionEra from './filters/condition-era';
import * as conditionOccurrence from './filters/condition-occurrence';
import * as death from './filters/death';
import * as deviceExposure from './filters/device-exposure';
import * as doseEra from './filters/dose-era';
import * as drugEra from './filters/drug-era';
import * as drugExposure from './filters/drug-exposure';
import * as measurement from './filters/measurement';
import * as observation from './filters/observation';
import * as observationPeriod from './filters/observation-period';
import * as procedureOccurrence from './filters/procedure-occurrence';
import * as specimen from './filters/specimen';
import * as visitOccurrence from './filters/visit-occurrence';
import * as demographic from './filters/demographic';
import { CohortDefinition, Concept, Filter } from '../types/type';
import { getBaseDB } from './base';
import {
  CreateTableBuilder,
  DeleteQueryBuilder,
  DropTableBuilder,
  InsertQueryBuilder,
  SelectQueryBuilder,
  sql,
} from 'kysely';
import { format } from 'sql-formatter';
import { Database } from '../db/types';
import { Kysely } from 'kysely';

const buildConceptQuery = (db: Kysely<Database>, concepts: Concept[]) => {
  if (!concepts.length) {
    return db
      .selectFrom('concept')
      .select('concept.concept_id')
      .where(({ eb }) => eb(eb.val(1), '=', eb.val(0)));
  }

  let query = db
    .selectFrom('concept')
    .select('concept.concept_id')
    .where(({ eb }) =>
      eb(
        'concept.concept_id',
        'in',
        concepts.map((e) => eb.fn<any>('_to_int64', [eb.val(e.concept_id)])),
      ),
    );

  let descendant = concepts.filter((e) => e.includeDescendants);
  if (descendant.length) {
    query = query.unionAll(
      db
        .selectFrom('concept')
        .select('concept.concept_id')
        .leftJoin(
          'concept_ancestor',
          'concept.concept_id',
          'concept_ancestor.descendant_concept_id',
        )
        .where(({ eb, and }) =>
          and([
            eb(
              'concept_ancestor.ancestor_concept_id',
              'in',
              descendant.map((e) =>
                eb.fn<any>('_to_int64', [eb.val(e.concept_id)]),
              ),
            ),
            eb('concept.invalid_reason', 'is', null),
          ]),
        ),
    );
  }

  let mapped = concepts.filter((e) => e.includeMapped);
  if (mapped.length) {
    query = query.unionAll(
      // @ts-ignore
      db
        .selectFrom(query.as('concept_mapped'))
        .leftJoin(
          'concept_relationship',
          'concept_mapped.concept_id',
          'concept_relationship.concept_id_2',
        )
        .select('concept_relationship.concept_id_1 as concept_id')
        .where('relationship_id', '=', 'Maps to')
        .where('invalid_reason', 'is', null)
        .where(({ eb, and }) =>
          and([
            eb(
              'concept_mapped.concept_id',
              'in',
              mapped.map((e) =>
                eb.fn<any>('_to_int64', [eb.val(e.concept_id)]),
              ),
            ),
          ]),
        ),
    );
  }

  return query;
};

const handleFilter = (db: Kysely<Database>, filter: Filter) => {
  switch (filter.type) {
    case 'condition_era':
      return conditionEra.getQuery(db, filter);
    case 'condition_occurrence':
      return conditionOccurrence.getQuery(db, filter);
    case 'death':
      return death.getQuery(db, filter);
    case 'device_exposure':
      return deviceExposure.getQuery(db, filter);
    case 'dose_era':
      return doseEra.getQuery(db, filter);
    case 'drug_era':
      return drugEra.getQuery(db, filter);
    case 'drug_exposure':
      return drugExposure.getQuery(db, filter);
    case 'measurement':
      return measurement.getQuery(db, filter);
    case 'observation':
      return observation.getQuery(db, filter);
    case 'observation_period':
      return observationPeriod.getQuery(db, filter);
    case 'procedure_occurrence':
      return procedureOccurrence.getQuery(db, filter);
    case 'specimen':
      return specimen.getQuery(db, filter);
    case 'visit_occurrence':
      return visitOccurrence.getQuery(db, filter);
    case 'demographic':
      return demographic.getQuery(db, filter);
    default:
      throw new Error(`Unknown filter type: ${filter}`);
  }
};

type ExecutableBuilder =
  | CreateTableBuilder<any, any>
  | InsertQueryBuilder<any, any, any>
  | DeleteQueryBuilder<any, any, any>
  | DropTableBuilder
  | SelectQueryBuilder<any, any, any>;

export const buildQuery = (
  db: Kysely<Database>,
  options: {
    cohortId?: string;
    cohortDef: CohortDefinition;
    database?: 'clickhouse' | 'postgres' | string;
  },
) => {
  let { cohortId, cohortDef, database } = options;
  database = database || 'clickhouse';

  const queries: (ExecutableBuilder | ExecutableBuilder[])[] = [
    [
      db.schema
        .createTable('codesets')
        .temporary()
        .addColumn(
          'codeset_id',
          database === 'clickhouse' ? sql`Int64` : 'bigint',
        )
        .addColumn(
          'concept_id',
          database === 'clickhouse' ? sql`Int64` : 'bigint',
        ),
      db.schema
        .createTable('temp_cohort_detail')
        .temporary()
        .addColumn(
          'cohort_id',
          database === 'clickhouse' ? sql`Int64` : 'bigint',
        )
        .addColumn(
          'person_id',
          database === 'clickhouse' ? sql`Int64` : 'bigint',
        ),
    ],
  ];

  const cleanupQueries: (ExecutableBuilder | ExecutableBuilder[])[] = [
    [
      db.schema.dropTable('codesets'),
      db.schema.dropTable('temp_cohort_detail'),
    ],
  ];

  const { conceptsets, initialGroup, comparisonGroup } = cohortDef;

  if (conceptsets && conceptsets.length) {
    conceptsets.map((e) => {
      queries.push(
        db
          .insertInto('codesets')
          .columns(['codeset_id', 'concept_id'])
          .expression(
            db
              .selectFrom(
                buildConceptQuery(
                  db,
                  e.items.filter((e) => !e.isExcluded),
                ).as('concept_include'),
              )
              .select(({ eb }) => [
                eb
                  .fn<any>('_to_int64', [eb.val(e.conceptset_id)])
                  .as('codeset_id'),
                'concept_include.concept_id',
              ])
              .distinctOn(['concept_include.concept_id'])
              .leftJoin(
                buildConceptQuery(
                  db,
                  e.items.filter((e) => e.isExcluded),
                ).as('concept_exclude'),
                'concept_include.concept_id',
                'concept_exclude.concept_id',
              )
              .where(({ eb }) =>
                eb(
                  'concept_exclude.concept_id',
                  '=',
                  eb.fn<any>('_to_int64', [eb.val('0')]),
                ),
              ),
          ),
      );
    });
  }

  // handle initial group
  for (let i = 0; i < initialGroup.containers.length; i++) {
    let container = initialGroup.containers[i];
    let query: SelectQueryBuilder<Database, any, any> | undefined;
    for (let filter of container.filters) {
      if (!query) {
        query = handleFilter(db, filter);
      } else {
        query = query.intersect(handleFilter(db, filter));
      }
    }

    if (!query) continue;

    switch ('operator' in container && container.operator) {
      case 'AND':
        query = db
          .selectFrom('temp_cohort_detail')
          .select('person_id')
          .where(({ eb }) =>
            eb('cohort_id', '=', eb.fn<any>('_to_int64', [eb.val(i)])),
          )
          .where('person_id', 'in', query);
        break;
      case 'OR':
        query = db
          .selectFrom('temp_cohort_detail')
          .select('person_id')
          .where(({ eb }) =>
            eb('cohort_id', '=', eb.fn<any>('_to_int64', [eb.val(i)])),
          )
          .union(query);
        break;
      case 'NOT':
        query = db
          .selectFrom('temp_cohort_detail')
          .select('person_id')
          .where(({ eb }) =>
            eb('cohort_id', '=', eb.fn<any>('_to_int64', [eb.val(i)])),
          )
          .except(query);
        break;
      default:
        break;
    }

    queries.push(
      db.insertInto('temp_cohort_detail').expression(
        db
          .selectFrom(query.as('tmp'))
          .select(({ eb }) => [
            eb.fn<any>('_to_int64', [eb.val(i + 1)]).as('cohort_id'),
            'person_id',
          ])
          .distinct(),
      ),
    );
  }

  // handle comparison group
  if (comparisonGroup) {
    for (let i = 0; i < comparisonGroup.containers.length; i++) {
      let container = comparisonGroup.containers[i];
      let query: SelectQueryBuilder<Database, any, any> | undefined;
      for (let filter of container.filters) {
        if (!query) {
          query = handleFilter(db, filter);
        } else {
          query = query.intersect(handleFilter(db, filter));
        }
      }

      if (!query) continue;

      switch ('operator' in container && container.operator) {
        case 'AND':
          query = db
            .selectFrom('temp_cohort_detail')
            .select('person_id')
            .where(({ eb }) =>
              eb(
                'cohort_id',
                '=',
                eb.fn<any>('_to_int64', [
                  eb.val(initialGroup.containers.length + i),
                ]),
              ),
            )
            .where('person_id', 'in', query);
          break;
        case 'OR':
          query = db
            .selectFrom('temp_cohort_detail')
            .select('person_id')
            .where(({ eb }) =>
              eb(
                'cohort_id',
                '=',
                eb.fn<any>('_to_int64', [
                  eb.val(initialGroup.containers.length + i),
                ]),
              ),
            )
            .union(
              db
                .selectFrom('temp_cohort_detail')
                .select('person_id')
                .where(({ eb }) =>
                  eb(
                    'cohort_id',
                    '=',
                    eb.fn<any>('_to_int64', [
                      eb.val(initialGroup.containers.length),
                    ]),
                  ),
                )
                .where('person_id', 'in', query),
            );
          break;
        case 'NOT':
          query = db
            .selectFrom('temp_cohort_detail')
            .select('person_id')
            .where(({ eb }) =>
              eb(
                'cohort_id',
                '=',
                eb.fn<any>('_to_int64', [
                  eb.val(initialGroup.containers.length + i),
                ]),
              ),
            )
            .except(query);
          break;
        default:
          query = db
            .selectFrom('temp_cohort_detail')
            .select('person_id')
            .where(({ eb }) =>
              eb(
                'cohort_id',
                '=',
                eb.fn<any>('_to_int64', [
                  eb.val(initialGroup.containers.length),
                ]),
              ),
            )
            .where('person_id', 'in', query);
          break;
      }

      queries.push(
        db.insertInto('temp_cohort_detail').expression(
          db
            .selectFrom(query.as('tmp'))
            .select(({ eb }) => [
              eb
                .fn<any>('_to_int64', [
                  eb.val(initialGroup.containers.length + i + 1),
                ])
                .as('cohort_id'),
              'person_id',
            ])
            .distinct(),
        ),
      );
    }
  }

  const finalQueries: ExecutableBuilder[] = [
    db
      .selectFrom('temp_cohort_detail')
      .groupBy('cohort_id')
      .orderBy('cohort_id', 'asc')
      .select(({ fn }) => [
        'cohort_id as container_id',
        fn.count('person_id').as('count'),
      ]),
  ];

  if (cohortId) {
    queries.push(
      db.deleteFrom('cohort_detail').where('cohort_id', '=', cohortId),
    );

    finalQueries.push(
      db.insertInto('cohort_detail').expression(
        db
          .selectFrom(
            db
              .selectFrom('temp_cohort_detail')
              .select('person_id')
              .where(({ eb }) =>
                eb(
                  'cohort_id',
                  '=',
                  eb.fn<any>('_to_int64', [
                    eb.val(
                      initialGroup.containers.length +
                        (comparisonGroup?.containers.length ?? 0),
                    ),
                  ]),
                ),
              )
              .as('tmp'),
          )
          .select(({ eb }) => [eb.val(cohortId).as('cohort_id'), 'person_id']),
      ),
    );
  }

  queries.push(finalQueries);

  return [...queries, ...cleanupQueries];
};

const checkOptimizable = async () => {
  let cnt = 0;
  const map: { [key: string]: () => void } = {
    first_condition_era: conditionEra.optimizeFirst,
    first_condition_occurrence: conditionOccurrence.optimizeFirst,
    first_drug_era: drugEra.optimizeFirst,
    first_measurement: measurement.optimizeFirst,
    first_observation: observation.optimizeFirst,
    first_procedure_occurrence: procedureOccurrence.optimizeFirst,
    first_visit_occurrence: visitOccurrence.optimizeFirst,
    first_drug_exposure: drugExposure.optimizeFirst,
    first_device_exposure: deviceExposure.optimizeFirst,
    first_specimen: specimen.optimizeFirst,
    first_observation_period: observationPeriod.optimizeFirst,
    first_dose_era: doseEra.optimizeFirst,
  };
  const res = await getBaseDB().introspection.getTables();
  for (let table of res) {
    if (map[table.name]) {
      map[table.name]();
      cnt++;
    }
  }

  console.log(`${cnt} tables optimized`);
};
checkOptimizable();
