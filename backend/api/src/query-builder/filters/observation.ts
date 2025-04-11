import { ObservationFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleStringWithOperator,
  handleConceptSet,
} from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

export const getQuery = (db: Kysely<Database>, a: ObservationFilter) => {
  let query = db
    .selectFrom("observation")
    .select(({ fn }) => [
      "observation.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "observation.person_id",
        "observation.observation_date"
      ),
    ])
    .leftJoin("person", "observation.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "observation.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin("provider", "observation.provider_id", "provider.provider_id");

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "observation.observation_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "observation.observation_date",
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

  if (a.date) {
    query = handleDateWithOperator(
      query,
      "observation.observation_date",
      a.date
    );
  }

  if (a.observationType) {
    query = handleIdentifierWithOperator(
      query,
      "observation.observation_type_concept_id",
      a.observationType
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.valueAsNumber) {
    query = handleNumberWithOperator(
      query,
      "observation.value_as_number",
      a.valueAsNumber
    );
  }

  if (a.valueAsString) {
    query = handleStringWithOperator(
      query,
      "observation.value_as_string",
      a.valueAsString
    );
  }

  if (a.valueAsConcept) {
    query = handleIdentifierWithOperator(
      query,
      "observation.value_as_concept_id",
      a.valueAsConcept
    );
  }

  if (a.qualifierType) {
    query = handleIdentifierWithOperator(
      query,
      "observation.qualifier_concept_id",
      a.qualifierType
    );
  }

  if (a.unitType) {
    query = handleIdentifierWithOperator(
      query,
      "observation.unit_concept_id",
      a.unitType
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      "observation.observation_source_concept_id",
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
      .selectFrom(query.as("filtered_observation"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
