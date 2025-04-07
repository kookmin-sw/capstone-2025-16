import { SpecimenFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";

export const getQuery = (a: SpecimenFilter) => {
  let query = getBaseDB()
    .selectFrom("specimen")
    .select(({ fn }) => [
      "specimen.person_id as person_id",
      "specimen.specimen_date as start_date",
      "specimen.specimen_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "specimen.person_id",
        "specimen.specimen_date"
      ),
    ])
    .leftJoin("person", "specimen.person_id", "person.person_id");

  if (a.conceptset) {
    query = handleConceptSet(
      query,
      "specimen.specimen_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "specimen.specimen_date",
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
    return getBaseDB()
      .selectFrom(query.as("filtered_specimen"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
