import { format } from "sql-formatter";
import { ConditionEraFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";

export const getQuery = (a: ConditionEraFilter) => {
  let query = getBaseDB()
    .selectFrom("condition_era")
    .select(({ fn }) => [
      "condition_era.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "condition_era.person_id",
        "condition_era.condition_era_start_date"
      ),
    ])
    .leftJoin("person", "condition_era.person_id", "person.person_id");

  if (a.conceptset) {
    query = handleConceptSet(
      query,
      "condition_era.condition_concept_id",
      a.conceptset
    );
  }

  if (a.startAge) {
    query = handleAgeWithNumberOperator(
      query,
      "condition_era.condition_era_start_date",
      "person.year_of_birth",
      a.startAge
    );
  }

  if (a.endAge) {
    query = handleAgeWithNumberOperator(
      query,
      "condition_era.condition_era_end_date",
      "person.year_of_birth",
      a.endAge
    );
  }

  if (a.gender) {
    query = handleIdentifierWithOperator(
      query,
      "person.gender_concept_id",
      a.gender
    );
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

  if (a.first) {
    return getBaseDB()
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
