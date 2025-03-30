import {
  Expression,
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
  expressionBuilder,
} from "kysely";
import {
  BigIntWithOperator,
  DateWithOperator,
  NumberWithOperator,
  StringWithOperator,
} from "../types/type";

const isNumberArray = (arr: any[]): arr is number[] => {
  return arr.every((item) => typeof item === "number");
};

const isBigIntArray = (arr: any[]): arr is bigint[] => {
  return arr.every((item) => typeof item === "bigint");
};

const max = (arr: number[] | bigint[] | string[]): number | bigint | string => {
  if (isNumberArray(arr) || isBigIntArray(arr)) {
    return arr.reduce((max, curr) => {
      return curr > max ? curr : max;
    }, arr[0]);
  }

  const maxIndex = arr.reduce((maxIdx, curr, idx, arr) => {
    return new Date(curr) > new Date(arr[maxIdx]) ? idx : maxIdx;
  }, 0);

  return arr[maxIndex];
};

const min = (arr: number[] | bigint[] | string[]): number | bigint | string => {
  if (isNumberArray(arr) || isBigIntArray(arr)) {
    return arr.reduce((min, curr) => {
      return curr < min ? curr : min;
    }, arr[0]);
  }

  const minIndex = arr.reduce((minIdx, curr, idx, arr) => {
    return new Date(curr) < new Date(arr[minIdx]) ? idx : minIdx;
  }, 0);

  return arr[minIndex];
};

export const handleAgeWithNumberOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  dateColumn: StringReference<DB, TB>,
  birthColumn: StringReference<DB, TB>,
  operator: NumberWithOperator
) => {
  const eb = expressionBuilder<DB, TB>();
  return handleNumberWithOperator(
    query,
    eb(eb.fn("_get_year", [eb.ref(dateColumn)]), "-", eb.ref(birthColumn)),
    operator
  );
};

export const handleStringWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<string> | ReferenceExpression<DB, TB>,
  operator: StringWithOperator
) => {
  if (typeof operator === "string") {
    return query.where(column, "=", operator);
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(column, "not in", operator.neq);
    } else {
      query = query.where(column, "!=", operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(column, "in", operator.eq);
    } else {
      query = query.where(column, "=", operator.eq);
    }
  }

  const eb = expressionBuilder<DB, TB>();

  if (operator.startsWith) {
    if (Array.isArray(operator.startsWith) && !operator.startsWith.length) {
      const arr = operator.startsWith;
      query = query.where(({ or }) => {
        return or(
          arr.map((s: string) =>
            eb(column, "ilike", s.replace("%", "%%") + "%")
          )
        );
      });
    } else {
      query = query.where(column, "ilike", operator.startsWith + "%");
    }
  }

  if (operator.endsWith) {
    if (Array.isArray(operator.endsWith) && !operator.endsWith.length) {
      const arr = operator.endsWith;
      query = query.where(({ or }) => {
        return or(
          arr.map((s: string) =>
            eb(column, "ilike", "%" + s.replace("%", "%%"))
          )
        );
      });
    } else {
      query = query.where(column, "ilike", "%" + operator.endsWith);
    }
  }

  if (operator.contains) {
    if (Array.isArray(operator.contains) && !operator.contains.length) {
      const arr = operator.contains;
      query = query.where(({ or }) => {
        return or(
          arr.map((s: string) =>
            eb(column, "ilike", "%" + s.replace("%", "%%") + "%")
          )
        );
      });
    } else {
      query = query.where(column, "ilike", "%" + operator.contains + "%");
    }
  }

  return query;
};

export const handleDateWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<Date> | ReferenceExpression<DB, TB>,
  operator: DateWithOperator
) => {
  const eb = expressionBuilder<DB, TB>();

  if (typeof operator === "string") {
    return query.where(column, "=", eb.fn("_to_date", [eb.val(operator)]));
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(
        column,
        "not in",
        operator.neq.map((d) => eb.fn("_to_date", [eb.val(d)]))
      );
    } else {
      query = query.where(
        column,
        "!=",
        eb.fn("_to_date", [eb.val(operator.neq)])
      );
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(
        column,
        "in",
        operator.eq.map((d) => eb.fn("_to_date", [eb.val(d)]))
      );
    } else {
      query = query.where(
        column,
        "=",
        eb.fn("_to_date", [eb.val(operator.eq)])
      );
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt) && !operator.gt.length) {
      query = query.where(column, ">", max(operator.gt));
    } else {
      query = query.where(column, ">", operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte) && !operator.gte.length) {
      query = query.where(column, ">=", max(operator.gte));
    } else {
      query = query.where(column, ">=", operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt) && !operator.lt.length) {
      query = query.where(column, "<", min(operator.lt));
    } else {
      query = query.where(column, "<", operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte) && !operator.lte.length) {
      query = query.where(column, "<=", min(operator.lte));
    } else {
      query = query.where(column, "<=", operator.lte);
    }
  }

  return query;
};

export const handleNumberWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<bigint> | Expression<number> | ReferenceExpression<DB, TB>,
  operator: NumberWithOperator | BigIntWithOperator
) => {
  if (typeof operator === "number" || typeof operator === "bigint") {
    return query.where(column, "=", operator);
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq) && !operator.neq.length) {
      query = query.where(column, "not in", operator.neq);
    } else {
      query = query.where(column, "!=", operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq) && !operator.eq.length) {
      query = query.where(column, "in", operator.eq);
    } else {
      query = query.where(column, "=", operator.eq);
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt) && !operator.gt.length) {
      query = query.where(column, ">", max(operator.gt));
    } else {
      query = query.where(column, ">", operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte) && !operator.gte.length) {
      query = query.where(column, ">=", max(operator.gte));
    } else {
      query = query.where(column, ">=", operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt) && !operator.lt.length) {
      query = query.where(column, "<", min(operator.lt));
    } else {
      query = query.where(column, "<", operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte) && !operator.lte.length) {
      query = query.where(column, "<=", min(operator.lte));
    } else {
      query = query.where(column, "<=", operator.lte);
    }
  }

  return query;
};
