import { DeathFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";

export const getQuery = (a: DeathFilter) => {
  let query = getBaseDB()
    .selectFrom("death")
    .select(({ fn }) => [
      "death.person_id as person_id",
      "death.death_date as start_date",
      "death.death_date as end_date",
    ])
    .leftJoin("person", "death.person_id", "person.person_id");

  if (a.conceptset) {
    query = handleConceptSet(
      query,
      "death.death_type_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "death.death_date",
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
    query = handleDateWithOperator(query, "death.death_date", a.date);
  }

  if (a.deathType) {
    query = handleIdentifierWithOperator(
      query,
      "death.death_type_concept_id",
      a.deathType
    );
  }

  if (a.cause) {
    query = handleConceptSet(query, "death.cause_source_concept_id", a.cause);
  }

  return query;
};
