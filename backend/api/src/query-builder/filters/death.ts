import { DeathFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleConceptSet,
} from '../base';
import { Kysely } from 'kysely';
import { Database } from '../../db/types';

export const getQuery = (db: Kysely<Database>, a: DeathFilter) => {
  let query = db.selectFrom('death').select('death.person_id as person_id');

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'death.death_type_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'death.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'death.death_date',
        'person.year_of_birth',
        a.age,
      );
    }

    if (a.gender) {
      joinedQuery = handleIdentifierWithOperator(
        joinedQuery,
        'person.gender_concept_id',
        a.gender,
      );
    }

    query = joinedQuery;
  }

  if (a.date) {
    query = handleDateWithOperator(query, 'death.death_date', a.date);
  }

  if (a.deathType) {
    query = handleIdentifierWithOperator(
      query,
      'death.death_type_concept_id',
      a.deathType,
    );
  }

  if (a.cause) {
    query = handleConceptSet(
      db,
      query,
      'death.cause_source_concept_id',
      a.cause,
    );
  }

  return query;
};
