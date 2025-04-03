import { ObservationPeriodFilter } from "../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
} from "./base";

export const getQuery = (a: ObservationPeriodFilter) => {
  let query = getBaseDB()
    .selectFrom("observation_period")
    .select(({ fn }) => [
      "observation_period.person_id as person_id",
      "observation_period.observation_period_start_date as start_date",
      "observation_period.observation_period_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "observation_period.person_id",
        "observation_period.observation_period_start_date"
      ),
    ])
    .leftJoin("person", "observation_period.person_id", "person.person_id");

  if (a.startAge) {
    query = handleAgeWithNumberOperator(
      query,
      "observation_period.observation_period_start_date",
      "person.year_of_birth",
      a.startAge
    );
  }

  if (a.endAge) {
    query = handleAgeWithNumberOperator(
      query,
      "observation_period.observation_period_end_date",
      "person.year_of_birth",
      a.endAge
    );
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      "observation_period.observation_period_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "observation_period.observation_period_end_date",
      a.endDate
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      "observation_period.observation_period_end_date",
      "observation_period.observation_period_start_date",
      a.length
    );
  }

  if (a.first) {
    return getBaseDB()
      .selectFrom(query.as("filtered_observation_period"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
