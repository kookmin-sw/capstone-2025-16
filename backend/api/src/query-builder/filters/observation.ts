import { ObservationFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleStringWithOperator,
  handleConceptSet,
  getOptimizedTable,
} from '../base';
import { Kysely } from 'kysely';
import { Database } from '../../db/types';

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (
  db: Kysely<Database>,
  a: ObservationFilter,
  distinct: boolean,
) => {
  let query = db
    .selectFrom(
      getOptimizedTable(
        _optimizeFirst && a.first,
        'observation',
        'first_observation',
      ),
    )
    .select(({ fn }) => [
      'observation.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'observation.person_id',
        'observation.observation_date',
      ),
    ]);
  if ((!a.first || _optimizeFirst) && distinct) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'observation.observation_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'observation.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'observation.observation_date',
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

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.date) {
    query = handleDateWithOperator(
      query,
      'observation.observation_date',
      a.date,
    );
  }

  if (a.observationType) {
    query = handleIdentifierWithOperator(
      query,
      'observation.observation_type_concept_id',
      a.observationType,
    );
  }

  if (a.visitType) {
    let joinedQuery = query.leftJoin(
      'visit_occurrence',
      'observation.visit_occurrence_id',
      'visit_occurrence.visit_occurrence_id',
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      'visit_occurrence.visit_concept_id',
      a.visitType,
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.valueAsNumber) {
    query = handleNumberWithOperator(
      query,
      'observation.value_as_number',
      a.valueAsNumber,
    );
  }

  if (a.valueAsString) {
    query = handleStringWithOperator(
      query,
      'observation.value_as_string',
      a.valueAsString,
    );
  }

  if (a.valueAsConcept) {
    query = handleIdentifierWithOperator(
      query,
      'observation.value_as_concept_id',
      a.valueAsConcept,
    );
  }

  if (a.qualifierType) {
    query = handleIdentifierWithOperator(
      query,
      'observation.qualifier_concept_id',
      a.qualifierType,
    );
  }

  if (a.unitType) {
    query = handleIdentifierWithOperator(
      query,
      'observation.unit_concept_id',
      a.unitType,
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      'observation.observation_source_concept_id',
      a.source,
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      'provider',
      'observation.provider_id',
      'provider.provider_id',
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      'provider.specialty_concept_id',
      a.providerSpecialty,
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.first && !_optimizeFirst) {
    let finalQuery = db
      .selectFrom(query.as('filtered_observation'))
      .where('ordinal', '=', 1)
      .select('person_id');
    if (distinct) {
      finalQuery = finalQuery.distinct();
    }
    return finalQuery;
  }

  return query;
};
