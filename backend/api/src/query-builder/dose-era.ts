import { DoseEraFilter } from "../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
  handleConceptSet,
} from "./base";

export const getQuery = (a: DoseEraFilter) => {
  let query = getBaseDB()
    .selectFrom("dose_era")
    .select(({ fn }) => [
      "dose_era.person_id as person_id",
      "dose_era.dose_era_start_date as start_date",
      "dose_era.dose_era_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "dose_era.person_id",
        "dose_era.dose_era_start_date"
      ),
    ])
    .leftJoin("person", "dose_era.person_id", "person.person_id");

  if (a.conceptset) {
    query = handleConceptSet(query, "dose_era.drug_concept_id", a.conceptset);
  }

  if (a.startAge) {
    query = handleAgeWithNumberOperator(
      query,
      "dose_era.dose_era_start_date",
      "person.year_of_birth",
      a.startAge
    );
  }

  if (a.endAge) {
    query = handleAgeWithNumberOperator(
      query,
      "dose_era.dose_era_end_date",
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
      "dose_era.dose_era_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "dose_era.dose_era_end_date",
      a.endDate
    );
  }

  if (a.doseUnit) {
    query = handleIdentifierWithOperator(
      query,
      "dose_era.unit_concept_id",
      a.doseUnit
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      "dose_era.dose_era_end_date",
      "dose_era.dose_era_start_date",
      a.length
    );
  }

  if (a.doseValue) {
    query = handleNumberWithOperator(query, "dose_era.dose_value", a.doseValue);
  }

  if (a.first) {
    return getBaseDB()
      .selectFrom(query.as("filtered_dose_era"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
