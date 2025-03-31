import { db } from "../db/types";
import { DeathFilter } from "../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
} from "./base";

export const getQuery = (a: DeathFilter) => {
  let query = db
    .selectFrom("death")
    .select(({ fn }) => [
      "death.person_id as person_id",
      "death.death_date as start_date",
      "death.death_date as end_date",
    ])
    .leftJoin("person", "death.person_id", "person.person_id");

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

  // TODO: cause

  return query;
};
