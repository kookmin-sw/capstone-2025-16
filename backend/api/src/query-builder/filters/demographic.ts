import { format } from "sql-formatter";
import { DemographicFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";

export const getQuery = (a: DemographicFilter) => {
  let query = getBaseDB()
    .selectFrom("temp_cohort")
    .select(["person_id", "start_date", "end_date"])
    .where(
      "cohort_id",
      "=",
      getBaseDB()
        .selectFrom("temp_cohort")
        .select("cohort_id")
        .orderBy("cohort_id", "desc")
        .limit(1)
    )
    .leftJoin("person", "temp_cohort.person_id", "person.person_id");

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "temp_cohort.start_date",
      "person.year_of_birth",
      a.age
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
      "temp_cohort.start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(query, "temp_cohort.end_date", a.endDate);
  }

  if (a.raceType) {
    query = handleIdentifierWithOperator(
      query,
      "person.race_concept_id",
      a.raceType
    );
  }

  if (a.ethnicityType) {
    query = handleIdentifierWithOperator(
      query,
      "person.ethnicity_concept_id",
      a.ethnicityType
    );
  }

  return query;
};
