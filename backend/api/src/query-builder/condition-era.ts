import { db } from "../db/types";
import { ConditionEraFilter } from "../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
} from "./base";

export const getQuery = (a: ConditionEraFilter) => {
  let query = db
    .selectFrom("condition_era")
    .select(({ fn }) => [
      "condition_era.person_id as person_id",
      "condition_era.condition_era_start_date as start_date",
      "condition_era.condition_era_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "condition_era.person_id",
        "condition_era.condition_era_start_date"
      ),
    ])
    .leftJoin("person", "condition_era.person_id", "person.person_id");

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
    return db
      .selectFrom(query.as("filtered_condition_era"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
