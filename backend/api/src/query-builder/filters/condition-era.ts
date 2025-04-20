import { format } from "sql-formatter";
import { ConditionEraFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
  getBaseDB,
} from "../base";
import { expressionBuilder, Kysely } from "kysely";
import { Database } from "../../db/types";

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: ConditionEraFilter) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref("first_condition_era").as("condition_era")
        : "condition_era"
    )
    .select(({ fn }) => [
      "condition_era.person_id as person_id",
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        "condition_era.person_id",
        "condition_era.condition_era_start_date"
      ),
    ]);

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "condition_era.condition_concept_id",
      a.conceptset
    );
  }

  if (a.startAge || a.endAge || a.gender) {
    let joinedQuery = query.leftJoin(
      "person",
      "condition_era.person_id",
      "person.person_id"
    );

    if (a.startAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "condition_era.condition_era_start_date",
        "person.year_of_birth",
        a.startAge
      );
    }

    if (a.endAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "condition_era.condition_era_end_date",
        "person.year_of_birth",
        a.endAge
      );
    }

    if (a.gender) {
      joinedQuery = handleIdentifierWithOperator(
        joinedQuery,
        "person.gender_concept_id",
        a.gender
      );
    }

    query = joinedQuery;
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      "condition_era.condition_era_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "condition_era.condition_era_end_date",
      a.endDate
    );
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as("filtered_condition_era"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};

// {
//   let { sql, parameters } = getQuery({
//     conceptset: "0",
//     first: true,
//     startAge: 10,
//     endAge: 20,
//     gender: "4992392",
//     startDate: "2020-01-01",
//     endDate: "2020-12-31",
//   }).compile();
//   parameters.forEach(
//     (e, idx) =>
//       (sql = sql.replace(
//         sql.includes("?") ? "?" : `$${idx + 1}`,
//         typeof e === "string" ? `'${e}'` : `${e}`
//       ))
//   );
//   sql += ";";
//   console.log(format(sql));
// }
