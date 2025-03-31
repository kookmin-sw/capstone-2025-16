import { db } from "../db/types";
import { VisitOccurrenceFilter } from "../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
} from "./base";

export const getQuery = (a: VisitOccurrenceFilter) => {
  let query = db
    .selectFrom("visit_occurrence")
    .select(({ fn }) => [
      "visit_occurrence.person_id as person_id",
      "visit_occurrence.visit_start_date as start_date",
      "visit_occurrence.visit_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "visit_occurrence.person_id",
        "visit_occurrence.visit_start_date"
      ),
    ])
    .leftJoin("person", "visit_occurrence.person_id", "person.person_id")
    .leftJoin(
      "provider",
      "visit_occurrence.provider_id",
      "provider.provider_id"
    );

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "visit_occurrence.visit_start_date",
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
      "visit_occurrence.visit_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "visit_occurrence.visit_end_date",
      a.endDate
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      "visit_occurrence.visit_end_date",
      "visit_occurrence.visit_start_date",
      a.length
    );
  }

  // TODO: source

  if (a.providerSpecialty) {
    query = handleIdentifierWithOperator(
      query,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );
  }

  // TODO: placeOfService

  if (a.first) {
    return db
      .selectFrom(query.as("filtered_visit_occurrence"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
