import { VisitOccurrenceFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleYearMinusWithNumberOperator,
  handleConceptSet,
  getOptimizedTable,
} from '../base';
import { Kysely } from 'kysely';
import { Database } from '../../db/types';

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: VisitOccurrenceFilter) => {
  let query = db
    .selectFrom(
      getOptimizedTable(
        _optimizeFirst && a.first,
        'visit_occurrence',
        'first_visit_occurrence',
      ),
    )
    .select(({ fn }) => [
      'visit_occurrence.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'visit_occurrence.person_id',
        'visit_occurrence.visit_start_date',
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'visit_occurrence.visit_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'visit_occurrence.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'visit_occurrence.visit_start_date',
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

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      'visit_occurrence.visit_start_date',
      a.startDate,
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      'visit_occurrence.visit_end_date',
      a.endDate,
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      'visit_occurrence.visit_concept_id',
      a.visitType,
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      'visit_occurrence.visit_end_date',
      'visit_occurrence.visit_start_date',
      a.length,
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      'visit_occurrence.visit_source_concept_id',
      a.source,
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      'provider',
      'visit_occurrence.provider_id',
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

  if (a.placeOfService) {
    let joinedQuery = query.leftJoin(
      'care_site',
      'visit_occurrence.care_site_id',
      'care_site.care_site_id',
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      'care_site.place_of_service_concept_id',
      a.placeOfService,
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as('filtered_visit_occurrence'))
      .where('ordinal', '=', 1)
      .select('person_id')
      .distinct();
  }

  return query;
};
