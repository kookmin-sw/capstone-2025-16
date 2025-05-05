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
import {
  CohortDefinition,
  Concept,
  Filter,
  IdentifierWithOperator,
} from '../types/type';
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
    query = query.union(
      db
        .selectFrom('concept_ancestor')
        .select(({ eb }) => eb.ref('descendant_concept_id').as('concept_id'))
        .leftJoin(
          'concept',
          'concept.concept_id',
          'concept_ancestor.descendant_concept_id',
        )
        .where(({ eb, and }) =>
          and([
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
          ]),
        ),
    );
  }

  let mapped = concepts.filter((e) => e.includeMapped);
  if (mapped.length) {
    query = query.union(
      db
        .selectFrom('concept_relationship')
        .select(({ eb }) => eb.ref('concept_id_1').as('concept_id'))
        .where('relationship_id', '=', 'Maps to')
        .where('concept_id_2', 'in', query)
        .leftJoin(
          'concept',
          'concept.concept_id',
          'concept_relationship.concept_id_1',
        )
        .where('invalid_reason', 'is', null),
    );
  }

  return query;
};

const handleFilter = (
  db: Kysely<Database>,
  filter: Filter,
  distinct: boolean,
) => {
  switch (filter.type) {
    case 'condition_era':
      return conditionEra.getQuery(db, filter, distinct);
    case 'condition_occurrence':
      return conditionOccurrence.getQuery(db, filter, distinct);
    case 'death':
      return death.getQuery(db, filter, distinct);
    case 'device_exposure':
      return deviceExposure.getQuery(db, filter, distinct);
    case 'dose_era':
      return doseEra.getQuery(db, filter, distinct);
    case 'drug_era':
      return drugEra.getQuery(db, filter, distinct);
    case 'drug_exposure':
      return drugExposure.getQuery(db, filter, distinct);
    case 'measurement':
      return measurement.getQuery(db, filter, distinct);
    case 'observation':
      return observation.getQuery(db, filter, distinct);
    case 'observation_period':
      return observationPeriod.getQuery(db, filter, distinct);
    case 'procedure_occurrence':
      return procedureOccurrence.getQuery(db, filter, distinct);
    case 'specimen':
      return specimen.getQuery(db, filter, distinct);
    case 'visit_occurrence':
      return visitOccurrence.getQuery(db, filter, distinct);
    case 'demographic':
      return demographic.getQuery(db, filter, distinct);
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

const buildBaseQuery = (
  db: Kysely<Database>,
  database: 'clickhouse' | 'postgres' | string,
  cohortDef: CohortDefinition,
  distinct: boolean,
  baseCohortId?: string, // 코호드 아이디가 없으면 전체 환자에서 코호트 생성, 있다면 해당 코호트를 기반으로 다른 코호트 생성
) => {
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
                db
                  .selectFrom(
                    buildConceptQuery(
                      db,
                      e.items.filter((e) => !e.isExcluded),
                    ).as('concept_include'),
                  )
                  .select('concept_include.concept_id')
                  .distinct()
                  .except(
                    buildConceptQuery(
                      db,
                      e.items.filter((e) => e.isExcluded),
                    ),
                  )
                  .as('final_codesets'),
              )
              .select(({ eb }) => [
                eb
                  .fn<any>('_to_int64', [eb.val(e.conceptset_id)])
                  .as('codeset_id'),
                'concept_id',
              ]),
          ),
      );
    });
  }

  // handle initial group
  for (let i = 0; i < initialGroup.containers.length; i++) {
    let container = initialGroup.containers[i];
    let query: SelectQueryBuilder<Database, any, any> | undefined;
    for (let filter of container.filters) {
      let filterQuery: SelectQueryBuilder<Database, any, any> = handleFilter(
        db,
        filter,
        distinct,
      );
      if (baseCohortId) {
        filterQuery = filterQuery.intersect(({ eb }) =>
          eb
            .selectFrom('cohort_detail')
            .select('person_id')
            .where('cohort_id', '=', baseCohortId),
        );
      }
      if (!query) {
        query = filterQuery;
      } else {
        query = query.intersect(filterQuery);
      }
    }

    if (!query) continue;

    switch (i && 'operator' in container && container.operator) {
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
        let filterQuery: SelectQueryBuilder<Database, any, any> = handleFilter(
          db,
          filter,
          distinct,
        );
        if (baseCohortId) {
          filterQuery = filterQuery.intersect(({ eb }) =>
            eb
              .selectFrom('cohort_detail')
              .select('person_id')
              .where('cohort_id', '=', baseCohortId),
          );
        }
        if (!query) {
          query = filterQuery;
        } else {
          query = query.intersect(filterQuery);
        }
      }

      if (!query) continue;

      switch (i && 'operator' in container && container.operator) {
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

  return {
    queries,
    finalQueries,
    cleanupQueries,
    containerCount:
      initialGroup.containers.length +
      (comparisonGroup?.containers.length ?? 0),
  };
};

export const handleAI = (
  db: Kysely<Database>,
  cohortId: string,
  cohortDef: CohortDefinition,
  finalQueries: ExecutableBuilder[],
) => {
  const { initialGroup, comparisonGroup } = cohortDef;
  let conceptIds = new Set<string>();
  for (let i of [
    ...initialGroup.containers,
    ...(comparisonGroup?.containers ?? []),
  ]) {
    for (let j of i.filters) {
      for (let k of [
        'providerSpecialty',
        'anatomicSiteType',
        'ethnicityType',
        'raceType',
        'drugType',
        'operatorType',
        'source',
        'placeOfService',
        'deathType',
        'measurementType',
        'specimenType',
        'diseaseStatus',
        'deviceType',
        'doseUnit',
        'conceptset',
        'cause',
        'visitType',
        'observationType',
        'gender',
        'qualifierType',
        'conditionStatus',
        'procedureType',
        'conditionType',
        'valueAsConcept',
        'routeType',
        'unitType',
        'modifierType',
      ]) {
        if (j[k]) {
          let val: IdentifierWithOperator = j[k];
          if (typeof val === 'string') {
            conceptIds.add(val);
          } else {
            if (val.eq) {
              for (let i of Array.isArray(val.eq) ? val.eq : [val.eq]) {
                conceptIds.add(i);
              }
            }
            if (val.neq) {
              for (let i of Array.isArray(val.neq) ? val.neq : [val.neq]) {
                conceptIds.add(i);
              }
            }
          }
        }
      }
    }
  }
  finalQueries.push(
    db
      .insertInto('cohort_concept')
      .expression(
        db
          .selectFrom(db.selectFrom('codesets').select('concept_id').as('tmp'))
          .select(({ eb }) => [eb.val(cohortId).as('cohort_id'), 'concept_id']),
      ),
    db.insertInto('cohort_concept').values(
      [...conceptIds].map((e) => ({
        concept_id: e,
        cohort_id: cohortId,
      })),
    ),
  );
};

export const buildCreateCohortQuery = (
  db: Kysely<Database>,
  options: {
    cohortId?: string;
    cohortDef: CohortDefinition;
    database?: 'clickhouse' | 'postgres' | string;
  },
): (ExecutableBuilder | ExecutableBuilder[])[] => {
  let { cohortId, cohortDef, database } = options;
  database = database || 'clickhouse';

  const { queries, finalQueries, cleanupQueries, containerCount } =
    buildBaseQuery(db, database, cohortDef, true);

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
                  eb.fn<any>('_to_int64', [eb.val(containerCount)]),
                ),
              )
              .as('tmp'),
          )
          .select(({ eb }) => [eb.val(cohortId).as('cohort_id'), 'person_id']),
      ),
    );

    // AI 핸들링..
    handleAI(db, cohortId, cohortDef, finalQueries);
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
