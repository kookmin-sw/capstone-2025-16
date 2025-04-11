// TODO: 코호트에서 date 관련이 빠지면서 demographic 구현이 불가능해짐. 아예 빼버릴지, 아니면 다른 방식으로 접근해야 할지 고민 필요

import { format } from "sql-formatter";
import { DemographicFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
} from "../base";

export const getQuery = (a: DemographicFilter, prev_cohort_id: number) => {
  let query = getBaseDB()
    .selectFrom("temp_cohort_detail")
    .select("person_id")
    .where(
      ({ eb }) =>
        eb("cohort_id", "=", eb.fn<any>("_to_int64", [eb.val(prev_cohort_id)])) // TODO: 바뀐 코호트 규격에 따라서 변경 필요
    )
    .leftJoin("person", "temp_cohort_detail.person_id", "person.person_id");

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "temp_cohort_detail.start_date",
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
      "temp_cohort_detail.start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "temp_cohort_detail.end_date",
      a.endDate
    );
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
