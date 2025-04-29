import { DrugEraFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
  handleConceptSet,
} from "../base";
import { expressionBuilder, Kysely } from "kysely";
import { Database } from "../../db/types";

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: DrugEraFilter) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref("first_drug_era").as("drug_era")
        : "drug_era"
    )
    .select(({ fn }) => [
      "drug_era.person_id as person_id",
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        "drug_era.person_id",
        "drug_era.drug_era_start_date"
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "drug_era.drug_concept_id",
      a.conceptset
    );
  }

  if (a.startAge || a.endAge || a.gender) {
    let joinedQuery = query.leftJoin(
      "person",
      "drug_era.person_id",
      "person.person_id"
    );

    if (a.startAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "drug_era.drug_era_start_date",
        "person.year_of_birth",
        a.startAge
      );
    }

    if (a.endAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "drug_era.drug_era_end_date",
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
      "drug_era.drug_era_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "drug_era.drug_era_end_date",
      a.endDate
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      "drug_era.drug_era_end_date",
      "drug_era.drug_era_start_date",
      a.length
    );
  }

  if (a.eraExposureCount) {
    query = handleNumberWithOperator(
      query,
      "drug_era.drug_exposure_count",
      a.eraExposureCount
    );
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as("filtered_drug_era"))
      .where("ordinal", "=", 1)
      .select("person_id")
      .distinct();
  }

  return query;
};
