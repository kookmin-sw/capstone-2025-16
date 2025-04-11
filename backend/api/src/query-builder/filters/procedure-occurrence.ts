import { ProcedureOccurrenceFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

export const getQuery = (
  db: Kysely<Database>,
  a: ProcedureOccurrenceFilter
) => {
  let query = db
    .selectFrom("procedure_occurrence")
    .select(({ fn }) => [
      "procedure_occurrence.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "procedure_occurrence.person_id",
        "procedure_occurrence.procedure_date"
      ),
    ])
    .leftJoin("person", "procedure_occurrence.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "procedure_occurrence.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin(
      "provider",
      "procedure_occurrence.provider_id",
      "provider.provider_id"
    );

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "procedure_occurrence.procedure_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "procedure_occurrence.procedure_date",
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
      "procedure_occurrence.procedure_date",
      a.startDate
    );
  }

  if (a.procedureType) {
    query = handleIdentifierWithOperator(
      query,
      "procedure_occurrence.procedure_type_concept_id",
      a.procedureType
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.modifierType) {
    query = handleIdentifierWithOperator(
      query,
      "procedure_occurrence.modifier_concept_id",
      a.modifierType
    );
  }

  if (a.quantity) {
    query = handleNumberWithOperator(
      query,
      "procedure_occurrence.quantity",
      a.quantity
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      "procedure_occurrence.procedure_source_concept_id",
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
      .selectFrom(query.as("filtered_procedure_occurrence"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
