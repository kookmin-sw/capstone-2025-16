import { db } from "../db/types";
import { DrugEraFilter } from "../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
} from "./base";

export const getQuery = (a: DrugEraFilter) => {
  let query = db
    .selectFrom("drug_era")
    .select(({ fn }) => [
      "drug_era.person_id as person_id",
      "drug_era.drug_era_start_date as start_date",
      "drug_era.drug_era_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "drug_era.person_id",
        "drug_era.drug_era_start_date"
      ),
    ])
    .leftJoin("person", "drug_era.person_id", "person.person_id");

  if (a.startAge) {
    query = handleAgeWithNumberOperator(
      query,
      "drug_era.drug_era_start_date",
      "person.year_of_birth",
      a.startAge
    );
  }

  if (a.endAge) {
    query = handleAgeWithNumberOperator(
      query,
      "drug_era.drug_era_end_date",
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

  if (a.first) {
    return db
      .selectFrom(query.as("filtered_drug_era"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
