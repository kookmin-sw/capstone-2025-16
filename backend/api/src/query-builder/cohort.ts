import { CohortDefinition, IdentifierWithOperator } from '../types/type';
import { buildBaseQuery, ExecutableBuilder } from './base';
import { Database } from '../db/types';
import { Kysely } from 'kysely';

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
  );
  conceptIds.size &&
    finalQueries.push(
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

  const { queries, cleanupQueries, containerCount } = buildBaseQuery(
    db,
    database,
    cohortDef,
    true,
  );

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
