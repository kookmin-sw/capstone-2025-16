import {
  Expression,
  FunctionModule,
  OrderByDirectionExpression,
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
  expressionBuilder,
  TableExpression,
  JoinReferenceExpression,
  SelectQueryBuilderWithLeftJoin,
} from 'kysely';
import {
  IdentifierWithOperator,
  DateWithOperator,
  NumberWithOperator,
  StringWithOperator,
} from '../types/type';
import { PartitionByExpression } from 'kysely/dist/cjs/parser/partition-by-parser';
import { Database } from '../db/types';
import { Kysely } from 'kysely';
import { db } from '../db/types';

export const getBaseDB = () => {
  return db;
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
        .where('codeset_id', '=', conceptSet),
    );
  }

  if (conceptSet.eq) {
    if (Array.isArray(conceptSet.eq) && !conceptSet.eq.length) {
      query = query.where(
        column,
        'in',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where(
            'codeset_id',
            'in',
            conceptSet.eq.map((e) => eb.fn<any>('_to_int64', [eb.val(e)])),
          ),
      );
    } else {
      query = query.where(
        column,
        '=',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where(
            'codeset_id',
            '=',
            eb.fn<any>('_to_int64', [eb.val(conceptSet.eq)]),
          ),
      );
    }
  }

  if (conceptSet.neq) {
    if (Array.isArray(conceptSet.neq) && !conceptSet.neq.length) {
      query = query.where(
        column,
        'not in',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where(
            'codeset_id',
            'in',
            conceptSet.neq.map((e) => eb.fn<any>('_to_int64', [eb.val(e)])),
          ),
      );
    } else {
      query = query.where(
        column,
        '!=',
        eb
          .selectFrom('codesets')
          .select('concept_id')
          .where(
            'codeset_id',
            '=',
            eb.fn<any>('_to_int64', [eb.val(conceptSet.neq)]),
          ),
      );
    }
  }

  return query;
};

type OrderBy<DB, TB extends keyof DB> =
  | {
      column: StringReference<DB, TB>;
      direction: OrderByDirectionExpression;
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
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(column, 'not in', operator.neq);
    } else {
      query = query.where(column, '!=', operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(column, 'in', operator.eq);
    } else {
      query = query.where(column, '=', operator.eq);
    }
  }

  const eb = getExpressionBuilder(query);

  if (operator.startsWith) {
    if (Array.isArray(operator.startsWith) && !operator.startsWith.length) {
      const arr = operator.startsWith;
      query = query.where(({ or }) => {
        return or(
          arr.map((e) => eb(column, 'ilike', e.replace('%', '%%') + '%')),
        );
      });
    } else {
      query = query.where(column, 'ilike', operator.startsWith + '%');
    }
  }

  if (operator.endsWith) {
    if (Array.isArray(operator.endsWith) && !operator.endsWith.length) {
      const arr = operator.endsWith;
      query = query.where(({ or }) => {
        return or(
          arr.map((e) => eb(column, 'ilike', '%' + e.replace('%', '%%'))),
        );
      });
    } else {
      query = query.where(column, 'ilike', '%' + operator.endsWith);
    }
  }

  if (operator.contains) {
    if (Array.isArray(operator.contains) && !operator.contains.length) {
      const arr = operator.contains;
      query = query.where(({ or }) => {
        return or(
          arr.map((e) => eb(column, 'ilike', '%' + e.replace('%', '%%') + '%')),
        );
      });
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
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(
        column,
        'not in',
        operator.neq.map((e) => eb.fn('_to_date', [eb.val(e)])),
      );
    } else {
      query = query.where(
        column,
        '!=',
        eb.fn('_to_date', [eb.val(operator.neq)]),
      );
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(
        column,
        'in',
        operator.eq.map((e) => eb.fn('_to_date', [eb.val(e)])),
      );
    } else {
      query = query.where(
        column,
        '=',
        eb.fn('_to_date', [eb.val(operator.eq)]),
      );
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt) && !operator.gt.length) {
      query = query.where(column, '>', max(operator.gt));
    } else {
      query = query.where(column, '>', operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte) && !operator.gte.length) {
      query = query.where(column, '>=', max(operator.gte));
    } else {
      query = query.where(column, '>=', operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt) && !operator.lt.length) {
      query = query.where(column, '<', min(operator.lt));
    } else {
      query = query.where(column, '<', operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte) && !operator.lte.length) {
      query = query.where(column, '<=', min(operator.lte));
    } else {
      query = query.where(column, '<=', operator.lte);
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
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(column, 'not in', operator.neq);
    } else {
      query = query.where(column, '!=', operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(column, 'in', operator.eq);
    } else {
      query = query.where(column, '=', operator.eq);
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt) && !operator.gt.length) {
      query = query.where(column, '>', max(operator.gt));
    } else {
      query = query.where(column, '>', operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte) && !operator.gte.length) {
      query = query.where(column, '>=', max(operator.gte));
    } else {
      query = query.where(column, '>=', operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt) && !operator.lt.length) {
      query = query.where(column, '<', min(operator.lt));
    } else {
      query = query.where(column, '<', operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte) && !operator.lte.length) {
      query = query.where(column, '<=', min(operator.lte));
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
    return query.where(column, '=', eb.fn('_to_int64', [eb.val(operator)]));
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(
        column,
        'not in',
        operator.neq.map((e) => eb.fn('_to_int64', [eb.val(e)])),
      );
    } else {
      query = query.where(
        column,
        '!=',
        eb.fn('_to_int64', [eb.val(operator.neq)]),
      );
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(
        column,
        'in',
        operator.eq.map((e) => eb.fn('_to_int64', [eb.val(e)])),
      );
    } else {
      query = query.where(
        column,
        '=',
        eb.fn('_to_int64', [eb.val(operator.eq)]),
      );
    }
  }

  return query;
};
