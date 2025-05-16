import {
  Expression,
  FunctionModule,
  OrderByModifiers,
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
  expressionBuilder,
  CreateTableBuilder,
  DeleteQueryBuilder,
  DropTableBuilder,
  InsertQueryBuilder,
  sql,
} from 'kysely';
import {
  IdentifierWithOperator,
  DateWithOperator,
  NumberWithOperator,
  StringWithOperator,
  Concept,
  CohortDefinition,
  Filter,
} from '../types/type';
import { PartitionByExpression } from 'kysely/dist/cjs/parser/partition-by-parser';
import { Database } from '../db/types';
import { Kysely } from 'kysely';
import { db } from '../db/types';

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

export const getBaseDB = () => {
  return db;
};

export const getOptimizedTable = <T extends string>(
  b: any,
  original: T,
  optimize: string,
): T => {
  const eb = expressionBuilder<Database, any>();
  if (b) {
    return eb.table(optimize).as(original) as unknown as T;
  }
  return original;
};

export const getExpressionBuilder = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
) => {
  return expressionBuilder<DB, TB>();
};

export const handleConceptSet = <DB, TB extends keyof DB, O>(
  db: Kysely<Database>,
  query: SelectQueryBuilder<DB, TB, O>,
  column: StringReference<DB, TB>,
  conceptSet: IdentifierWithOperator,
) => {
  const eb = expressionBuilder<Database, any>();

  if (typeof conceptSet === 'string') {
    return query.where(
      column,
      'in',
      eb
        .selectFrom('codesets')
        .select('concept_id')
        .where('codeset_id', '=', eb.val(conceptSet)),
    );
  }

  if (conceptSet.eq) {
    if (Array.isArray(conceptSet.eq)) {
      if (conceptSet.eq.length) {
        query = query.where(
          column,
          'in',
          eb
            .selectFrom('codesets')
            .select('concept_id')
            .where(
              'codeset_id',
              'in',
              conceptSet.eq.map((e) => eb.val(e)),
            ),
        );
      }
    } else {
      query = query.where(
        column,
        'in',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where('codeset_id', '=', eb.val(conceptSet.eq)),
      );
    }
  }

  if (conceptSet.neq) {
    if (Array.isArray(conceptSet.neq)) {
      if (conceptSet.neq.length) {
        query = query.where(
          column,
          'not in',
          eb
            .selectFrom('codesets')
            .select('concept_id')
            .where(
              'codeset_id',
              'in',
              conceptSet.neq.map((e) => eb.val(e)),
            ),
        );
      }
    } else {
      query = query.where(
        column,
        'not in',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where('codeset_id', '=', eb.val(conceptSet.neq)),
      );
    }
  }

  return query;
};

type OrderBy<DB, TB extends keyof DB> =
  | {
      column: StringReference<DB, TB>;
      direction: OrderByModifiers;
    }
  | StringReference<DB, TB>;

export const handleRowNumber = <
  DB,
  TB extends keyof DB,
  PE extends PartitionByExpression<DB, TB>,
>(
  shouldHandle: boolean | undefined | null,
  fn: FunctionModule<DB, TB>,
  partitionBy: PE | PE[],
  orderBy: OrderBy<DB, TB> | OrderBy<DB, TB>[],
) => {
  if (!shouldHandle) return [];

  return [
    fn
      .agg('row_number')
      .over((ob) => {
        let tmp = ob;

        // @ts-ignore
        tmp = ob.partitionBy(partitionBy);

        if (!Array.isArray(orderBy)) {
          orderBy = [orderBy];
        }
        orderBy.forEach((o) => {
          if (typeof o === 'object') {
            tmp = tmp.orderBy(o.column, o.direction);
          } else {
            tmp = tmp.orderBy(o);
          }
        });
        return tmp;
      })
      .as('ordinal'),
  ];
};

const isNumberArray = (arr: any[]): arr is number[] => {
  return typeof arr[0] === 'number';
};

const max = (arr: number[] | string[]): number | bigint | string => {
  if (isNumberArray(arr)) {
    return arr.reduce((max, curr) => {
      return curr > max ? curr : max;
    }, arr[0]);
  }

  const maxIndex = arr.reduce((maxIdx, curr, idx, arr) => {
    return new Date(curr) > new Date(arr[maxIdx]) ? idx : maxIdx;
  }, 0);

  return arr[maxIndex];
};

const min = (arr: number[] | string[]): number | bigint | string => {
  if (isNumberArray(arr)) {
    return arr.reduce((min, curr) => {
      return curr < min ? curr : min;
    }, arr[0]);
  }

  const minIndex = arr.reduce((minIdx, curr, idx, arr) => {
    return new Date(curr) < new Date(arr[minIdx]) ? idx : minIdx;
  }, 0);

  return arr[minIndex];
};

export const handleYearMinusWithNumberOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  date1: StringReference<DB, TB>,
  date2: StringReference<DB, TB>,
  operator: NumberWithOperator,
) => {
  const eb = getExpressionBuilder(query);
  return handleNumberWithOperator(
    query,
    eb(
      eb.fn('_get_year', [eb.ref(date1)]),
      '-',
      eb.fn('_get_year', [eb.ref(date2)]),
    ),
    operator,
  );
};

export const handleAgeWithNumberOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  dateColumn: StringReference<DB, TB>,
  birthColumn: StringReference<DB, TB>,
  operator: NumberWithOperator,
) => {
  const eb = getExpressionBuilder(query);
  return handleNumberWithOperator(
    query,
    eb(eb.fn('_get_year', [eb.ref(dateColumn)]), '-', eb.ref(birthColumn)),
    operator,
  );
};

export const handleStringWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<string> | ReferenceExpression<DB, TB>,
  operator: StringWithOperator,
) => {
  if (typeof operator === 'string') {
    return query.where(column, '=', operator);
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq)) {
      if (operator.neq.length) {
        query = query.where(column, 'not in', operator.neq);
      }
    } else {
      query = query.where(column, '!=', operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      if (operator.eq.length) {
        query = query.where(column, 'in', operator.eq);
      }
    } else {
      query = query.where(column, '=', operator.eq);
    }
  }

  const eb = getExpressionBuilder(query);

  if (operator.startsWith) {
    if (Array.isArray(operator.startsWith)) {
      if (operator.startsWith.length) {
        const arr = operator.startsWith;
        query = query.where(({ or }) => {
          return or(
            arr.map((e) => eb(column, 'ilike', e.replace('%', '%%') + '%')),
          );
        });
      }
    } else {
      query = query.where(column, 'ilike', operator.startsWith + '%');
    }
  }

  if (operator.endsWith) {
    if (Array.isArray(operator.endsWith)) {
      if (operator.endsWith.length) {
        const arr = operator.endsWith;
        query = query.where(({ or }) => {
          return or(
            arr.map((e) => eb(column, 'ilike', '%' + e.replace('%', '%%'))),
          );
        });
      }
    } else {
      query = query.where(column, 'ilike', '%' + operator.endsWith);
    }
  }

  if (operator.contains) {
    if (Array.isArray(operator.contains)) {
      if (operator.contains.length) {
        const arr = operator.contains;
        query = query.where(({ or }) => {
          return or(
            arr.map((e) =>
              eb(column, 'ilike', '%' + e.replace('%', '%%') + '%'),
            ),
          );
        });
      }
    } else {
      query = query.where(column, 'ilike', '%' + operator.contains + '%');
    }
  }

  return query;
};

export const handleDateWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<Date> | ReferenceExpression<DB, TB>,
  operator: DateWithOperator,
) => {
  const eb = getExpressionBuilder(query);

  if (typeof operator === 'string') {
    return query.where(column, '=', eb.fn('_to_date', [eb.val(operator)]));
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq)) {
      if (operator.neq.length) {
        query = query.where(
          column,
          'not in',
          operator.neq.map((e) => eb.fn('_to_date', [eb.val(e)])),
        );
      }
    } else {
      query = query.where(
        column,
        '!=',
        eb.fn('_to_date', [eb.val(operator.neq)]),
      );
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      if (operator.eq.length) {
        query = query.where(
          column,
          'in',
          operator.eq.map((e) => eb.fn('_to_date', [eb.val(e)])),
        );
      }
    } else {
      query = query.where(
        column,
        '=',
        eb.fn('_to_date', [eb.val(operator.eq)]),
      );
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt)) {
      if (operator.gt.length) {
        query = query.where(
          column,
          '>',
          eb.fn('_to_date', [eb.val(max(operator.gt))]),
        );
      }
    } else {
      query = query.where(
        column,
        '>',
        eb.fn('_to_date', [eb.val(operator.gt)]),
      );
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte)) {
      if (operator.gte.length) {
        query = query.where(
          column,
          '>=',
          eb.fn('_to_date', [eb.val(max(operator.gte))]),
        );
      }
    } else {
      query = query.where(
        column,
        '>=',
        eb.fn('_to_date', [eb.val(operator.gte)]),
      );
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt)) {
      if (operator.lt.length) {
        query = query.where(
          column,
          '<',
          eb.fn('_to_date', [eb.val(min(operator.lt))]),
        );
      }
    } else {
      query = query.where(
        column,
        '<',
        eb.fn('_to_date', [eb.val(operator.lt)]),
      );
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte)) {
      if (operator.lte.length) {
        query = query.where(
          column,
          '<=',
          eb.fn('_to_date', [eb.val(min(operator.lte))]),
        );
      }
    } else {
      query = query.where(
        column,
        '<=',
        eb.fn('_to_date', [eb.val(operator.lte)]),
      );
    }
  }

  return query;
};

export const handleNumberWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<number> | ReferenceExpression<DB, TB>,
  operator: NumberWithOperator,
) => {
  if (typeof operator === 'number') {
    return query.where(column, '=', operator);
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq)) {
      if (operator.neq.length) {
        query = query.where(column, 'not in', operator.neq);
      }
    } else {
      query = query.where(column, '!=', operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      if (operator.eq.length) {
        query = query.where(column, 'in', operator.eq);
      }
    } else {
      query = query.where(column, '=', operator.eq);
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt)) {
      if (operator.gt.length) {
        query = query.where(column, '>', max(operator.gt));
      }
    } else {
      query = query.where(column, '>', operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte)) {
      if (operator.gte.length) {
        query = query.where(column, '>=', max(operator.gte));
      }
    } else {
      query = query.where(column, '>=', operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt)) {
      if (operator.lt.length) {
        query = query.where(column, '<', min(operator.lt));
      }
    } else {
      query = query.where(column, '<', operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte)) {
      if (operator.lte.length) {
        query = query.where(column, '<=', min(operator.lte));
      }
    } else {
      query = query.where(column, '<=', operator.lte);
    }
  }

  return query;
};

export const handleIdentifierWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<string> | ReferenceExpression<DB, TB>,
  operator: IdentifierWithOperator,
) => {
  const eb = getExpressionBuilder(query);

  if (typeof operator === 'string') {
    return query.where(column, '=', eb.val(operator));
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq)) {
      if (operator.neq.length) {
        query = query.where(
          column,
          'not in',
          operator.neq.map((e) => eb.val(e)),
        );
      }
    } else {
      query = query.where(column, '!=', eb.val(operator.neq));
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      if (operator.eq.length) {
        query = query.where(
          column,
          'in',
          operator.eq.map((e) => eb.val(e)),
        );
      }
    } else {
      query = query.where(column, '=', eb.val(operator.eq));
    }
  }

  return query;
};

export const buildConceptQuery = (
  db: Kysely<Database>,
  concepts: Concept[],
) => {
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
        concepts.map((e) => eb.val(e.concept_id)),
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
                descendant.map((e) => eb.val(e.concept_id)),
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

export const handleFilter = (
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

export type ExecutableBuilder =
  | CreateTableBuilder<any, any>
  | InsertQueryBuilder<any, any, any>
  | DeleteQueryBuilder<any, any, any>
  | DropTableBuilder
  | SelectQueryBuilder<any, any, any>;

export const buildBaseQuery = (
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
                eb.val(e.conceptset_id).as('codeset_id'),
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
          .where(({ eb }) => eb('cohort_id', '=', eb.val<any>(i)))
          .where('person_id', 'in', query);
        break;
      case 'OR':
        query = db
          .selectFrom('temp_cohort_detail')
          .select('person_id')
          .where(({ eb }) => eb('cohort_id', '=', eb.val<any>(i)))
          .union(query);
        break;
      case 'NOT':
        query = db
          .selectFrom('temp_cohort_detail')
          .select('person_id')
          .where(({ eb }) => eb('cohort_id', '=', eb.val<any>(i)))
          .except(query);
        break;
      default:
        break;
    }

    queries.push(
      db.insertInto('temp_cohort_detail').expression(
        db
          .selectFrom(query.as('tmp'))
          .select(({ eb }) => [eb.val(i + 1).as('cohort_id'), 'person_id'])
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
                eb.val<any>(initialGroup.containers.length + i),
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
                eb.val<any>(initialGroup.containers.length + i),
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
                    eb.val<any>(initialGroup.containers.length),
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
                eb.val<any>(initialGroup.containers.length + i),
              ),
            )
            .except(query);
          break;
        default:
          query = db
            .selectFrom('temp_cohort_detail')
            .select('person_id')
            .where(({ eb }) =>
              eb('cohort_id', '=', eb.val<any>(initialGroup.containers.length)),
            )
            .where('person_id', 'in', query);
          break;
      }

      queries.push(
        db.insertInto('temp_cohort_detail').expression(
          db
            .selectFrom(query.as('tmp'))
            .select(({ eb }) => [
              eb.val(initialGroup.containers.length + i + 1).as('cohort_id'),
              'person_id',
            ])
            .distinct(),
        ),
      );
    }
  }

  return {
    queries,
    cleanupQueries,
    containerCount:
      initialGroup.containers.length +
      (comparisonGroup?.containers.length ?? 0),
  };
};
