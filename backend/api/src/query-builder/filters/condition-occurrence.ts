import { ConditionOccurrenceFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from '../base';
import { expressionBuilder, Kysely } from 'kysely';
import { Database } from '../../db/types';

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (
  db: Kysely<Database>,
  a: ConditionOccurrenceFilter,
) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref('first_condition_occurrence').as('condition_occurrence')
        : 'condition_occurrence',
    )
    .select(({ fn }) => [
      'condition_occurrence.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'condition_occurrence.person_id',
        'condition_occurrence.condition_start_date',
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'condition_occurrence.condition_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'condition_occurrence.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'condition_occurrence.condition_start_date',
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

  if (a.conditionStatus) {
    query = handleIdentifierWithOperator(
      query,
      'condition_occurrence.condition_status_concept_id',
      a.conditionStatus,
    );
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      'condition_occurrence.condition_start_date',
      a.startDate,
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      'condition_occurrence.condition_end_date',
      a.endDate,
    );
  }

  if (a.conditionType) {
    query = handleIdentifierWithOperator(
      query,
      'condition_occurrence.condition_type_concept_id',
      a.conditionType,
    );
  }

  if (a.visitType) {
    let joinedQuery = query.leftJoin(
      'visit_occurrence',
      'condition_occurrence.visit_occurrence_id',
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

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      'condition_occurrence.condition_source_concept_id',
      a.source,
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      'provider',
      'condition_occurrence.provider_id',
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
    return db
      .selectFrom(query.as('filtered_condition_occurrence'))
      .where('ordinal', '=', 1)
      .select('person_id')
      .distinct();
  }

  return query;
};
