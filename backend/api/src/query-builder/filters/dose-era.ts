import { DoseEraFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
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

export const getQuery = (db: Kysely<Database>, a: DoseEraFilter) => {
  let query = db
    .selectFrom(
      getOptimizedTable(
        _optimizeFirst && a.first,
        'dose_era',
        'first_dose_era',
      ),
    )
    .select(({ fn }) => [
      'dose_era.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'dose_era.person_id',
        'dose_era.dose_era_start_date',
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'dose_era.drug_concept_id',
      a.conceptset,
    );
  }

  if (a.startAge || a.endAge || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'dose_era.person_id',
      'person.person_id',
    );

    if (a.startAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'dose_era.dose_era_start_date',
        'person.year_of_birth',
        a.startAge,
      );
    }

    if (a.endAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'dose_era.dose_era_end_date',
        'person.year_of_birth',
        a.endAge,
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

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      'dose_era.dose_era_start_date',
      a.startDate,
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      'dose_era.dose_era_end_date',
      a.endDate,
    );
  }

  if (a.doseUnit) {
    query = handleIdentifierWithOperator(
      query,
      'dose_era.unit_concept_id',
      a.doseUnit,
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      'dose_era.dose_era_end_date',
      'dose_era.dose_era_start_date',
      a.length,
    );
  }

  if (a.doseValue) {
    query = handleNumberWithOperator(query, 'dose_era.dose_value', a.doseValue);
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as('filtered_dose_era'))
      .where('ordinal', '=', 1)
      .select('person_id')
      .distinct();
  }

  return query;
};
