import { ObservationPeriodFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
} from "../base";
import { expressionBuilder, Kysely } from "kysely";
import { Database } from "../../db/types";

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: ObservationPeriodFilter) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref("first_observation_period").as("observation_period")
        : "observation_period"
    )
    .select(({ fn }) => [
      "observation_period.person_id as person_id",
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        "observation_period.person_id",
        "observation_period.observation_period_start_date"
      ),
    ]);

  if (a.startAge || a.endAge) {
    let joinedQuery = query.leftJoin(
      "person",
      "observation_period.person_id",
      "person.person_id"
    );

    if (a.startAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "observation_period.observation_period_start_date",
        "person.year_of_birth",
        a.startAge
      );
    }

    if (a.endAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "observation_period.observation_period_end_date",
        "person.year_of_birth",
        a.endAge
      );
    }

    query = joinedQuery;
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

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as("filtered_observation_period"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
