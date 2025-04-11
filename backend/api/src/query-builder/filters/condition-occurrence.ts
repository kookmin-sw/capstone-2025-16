import { ConditionOccurrenceFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

export const getQuery = (
  db: Kysely<Database>,
  a: ConditionOccurrenceFilter
) => {
  let query = db
    .selectFrom("condition_occurrence")
    .select(({ fn }) => [
      "condition_occurrence.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "condition_occurrence.person_id",
        "condition_occurrence.condition_start_date"
      ),
    ])
    .leftJoin("person", "condition_occurrence.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "condition_occurrence.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin(
      "provider",
      "condition_occurrence.provider_id",
      "provider.provider_id"
    );

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "condition_occurrence.condition_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "condition_occurrence.condition_start_date",
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

  if (a.conditionStatus) {
    query = handleIdentifierWithOperator(
      query,
      "condition_occurrence.condition_status_concept_id",
      a.conditionStatus
    );
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      "condition_occurrence.condition_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "condition_occurrence.condition_end_date",
      a.endDate
    );
  }

  if (a.conditionType) {
    query = handleIdentifierWithOperator(
      query,
      "condition_occurrence.condition_type_concept_id",
      a.conditionType
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      "condition_occurrence.condition_source_concept_id",
      a.source
    );
  }

  if (a.providerSpecialty) {
    query = handleIdentifierWithOperator(
      query,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );
  }

  if (a.first) {
    return db
      .selectFrom(query.as("filtered_condition_occurrence"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
