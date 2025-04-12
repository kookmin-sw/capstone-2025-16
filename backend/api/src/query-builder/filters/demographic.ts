import { DemographicFilter } from "../../types/type";
import { handleIdentifierWithOperator } from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

export const getQuery = (db: Kysely<Database>, a: DemographicFilter) => {
  let query = db.selectFrom("person").select("person_id");

  // if (a.age) {
  //   query = handleAgeWithNumberOperator(
  //     query,
  //     "temp_cohort_detail.start_date",
  //     "person.year_of_birth",
  //     a.age
  //   );
  // }

  if (a.gender) {
    query = handleIdentifierWithOperator(
      query,
      "person.gender_concept_id",
      a.gender
    );
  }

  // if (a.startDate) {
  //   query = handleDateWithOperator(
  //     query,
  //     "temp_cohort_detail.start_date",
  //     a.startDate
  //   );
  // }

  // if (a.endDate) {
  //   query = handleDateWithOperator(
  //     query,
  //     "temp_cohort_detail.end_date",
  //     a.endDate
  //   );
  // }

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
