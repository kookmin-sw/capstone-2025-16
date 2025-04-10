import { DrugEraFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
  handleConceptSet,
} from "../base";

export const getQuery = (a: DrugEraFilter) => {
  let query = getBaseDB()
    .selectFrom("drug_era")
    .select(({ fn }) => [
      "drug_era.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "drug_era.person_id",
        "drug_era.drug_era_start_date"
      ),
    ])
    .leftJoin("person", "drug_era.person_id", "person.person_id");

  if (a.conceptset) {
    query = handleConceptSet(query, "drug_era.drug_concept_id", a.conceptset);
  }

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
    return getBaseDB()
      .selectFrom(query.as("filtered_drug_era"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
