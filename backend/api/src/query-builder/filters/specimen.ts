import { SpecimenFilter } from "../../types/type";
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

export const getQuery = (db: Kysely<Database>, a: SpecimenFilter) => {
  let query = db
    .selectFrom("specimen")
    .select(({ fn }) => [
      "specimen.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "specimen.person_id",
        "specimen.specimen_date"
      ),
    ]);

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "specimen.specimen_concept_id",
      a.conceptset
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      "person",
      "specimen.person_id",
      "person.person_id"
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "specimen.specimen_date",
        "person.year_of_birth",
        a.age
      );
    }

    if (a.gender) {
      joinedQuery = handleIdentifierWithOperator(
        joinedQuery,
        "person.gender_concept_id",
        a.gender
      );
    }

    query = joinedQuery;
  }

  if (a.date) {
    query = handleDateWithOperator(query, "specimen.specimen_date", a.date);
  }

  if (a.specimenType) {
    query = handleIdentifierWithOperator(
      query,
      "specimen.specimen_type_concept_id",
      a.specimenType
    );
  }

  if (a.quantity) {
    query = handleNumberWithOperator(query, "specimen.quantity", a.quantity);
  }

  if (a.unitType) {
    query = handleIdentifierWithOperator(
      query,
      "specimen.unit_concept_id",
      a.unitType
    );
  }

  if (a.anatomicSiteType) {
    query = handleIdentifierWithOperator(
      query,
      "specimen.anatomic_site_concept_id",
      a.anatomicSiteType
    );
  }

  if (a.diseaseStatus) {
    query = handleIdentifierWithOperator(
      query,
      "specimen.disease_status_concept_id",
      a.diseaseStatus
    );
  }

  if (a.first) {
    return db
      .selectFrom(query.as("filtered_specimen"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
