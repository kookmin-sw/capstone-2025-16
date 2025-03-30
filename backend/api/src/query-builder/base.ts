import {
  Expression,
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
  expressionBuilder,
} from "kysely";
import {
  DateWithOperator,
  NumberWithOperator,
  StringWithOperator,
} from "../types/type";

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
    if (Array.isArray(operator.neq)) {
      query = query.where(column, "not in", operator.neq);
    } else {
      query = query.where(column, "!=", operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      query = query.where(column, "in", operator.eq);
    } else {
      query = query.where(column, "=", operator.eq);
    }
  }

  const eb = expressionBuilder<DB, TB>();

  if (operator.startsWith) {
    if (Array.isArray(operator.startsWith)) {
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
    if (Array.isArray(operator.endsWith)) {
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
    if (Array.isArray(operator.contains)) {
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
    if (Array.isArray(operator.neq)) {
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
    if (Array.isArray(operator.eq)) {
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
    if (Array.isArray(operator.gt)) {
      const maxIndex = operator.gt.reduce((maxIdx, curr, idx, arr) => {
        return new Date(curr) > new Date(arr[maxIdx]) ? idx : maxIdx;
      }, 0);

      query = query.where(
        column,
        ">",
        eb.fn("_to_date", [eb.val(operator.gt[maxIndex])])
      );
    } else {
      query = query.where(
        column,
        ">",
        eb.fn("_to_date", [eb.val(operator.gt)])
      );
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte)) {
      const maxIndex = operator.gte.reduce((maxIdx, curr, idx, arr) => {
        return new Date(curr) > new Date(arr[maxIdx]) ? idx : maxIdx;
      }, 0);

      query = query.where(
        column,
        ">=",
        eb.fn("_to_date", [eb.val(operator.gte[maxIndex])])
      );
    } else {
      query = query.where(
        column,
        ">=",
        eb.fn("_to_date", [eb.val(operator.gte)])
      );
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt)) {
      const minIndex = operator.lt.reduce((minIdx, curr, idx, arr) => {
        return new Date(curr) < new Date(arr[minIdx]) ? idx : minIdx;
      }, 0);

      query = query.where(
        column,
        "<",
        eb.fn("_to_date", [eb.val(operator.lt[minIndex])])
      );
    } else {
      query = query.where(
        column,
        "<",
        eb.fn("_to_date", [eb.val(operator.lt)])
      );
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte)) {
      const minIndex = operator.lte.reduce((minIdx, curr, idx, arr) => {
        return new Date(curr) < new Date(arr[minIdx]) ? idx : minIdx;
      }, 0);

      query = query.where(
        column,
        "<=",
        eb.fn("_to_date", [eb.val(operator.lte[minIndex])])
      );
    } else {
      query = query.where(
        column,
        "<=",
        eb.fn("_to_date", [eb.val(operator.lte)])
      );
    }
  }

  return query;
};

export const handleNumberWithOperator = <DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  column: Expression<number> | ReferenceExpression<DB, TB>,
  operator: NumberWithOperator
) => {
  if (typeof operator === "number") {
    return query.where(column, "=", operator);
  }

  if (operator.neq) {
    if (Array.isArray(operator.neq)) {
      query = query.where(column, "not in", operator.neq);
    } else {
      query = query.where(column, "!=", operator.neq);
    }
  }

  if (operator.eq) {
    if (Array.isArray(operator.eq)) {
      query = query.where(column, "in", operator.eq);
    } else {
      query = query.where(column, "=", operator.eq);
    }
  }

  if (operator.gt) {
    if (Array.isArray(operator.gt)) {
      query = query.where(column, ">", Math.max(...operator.gt));
    } else {
      query = query.where(column, ">", operator.gt);
    }
  }

  if (operator.gte) {
    if (Array.isArray(operator.gte)) {
      query = query.where(column, ">=", Math.max(...operator.gte));
    } else {
      query = query.where(column, ">=", operator.gte);
    }
  }

  if (operator.lt) {
    if (Array.isArray(operator.lt)) {
      query = query.where(column, "<", Math.min(...operator.lt));
    } else {
      query = query.where(column, "<", operator.lt);
    }
  }

  if (operator.lte) {
    if (Array.isArray(operator.lte)) {
      query = query.where(column, "<=", Math.min(...operator.lte));
    } else {
      query = query.where(column, "<=", operator.lte);
    }
  }

  return query;
};
