import { DrugEraFilter } from '../../types/type';
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

export const getQuery = (
  db: Kysely<Database>,
  a: DrugEraFilter,
  distinct: boolean,
) => {
  let query = db
    .selectFrom(
      getOptimizedTable(
        _optimizeFirst && a.first,
        'drug_era',
        'first_drug_era',
      ),
    )
    .select(({ fn }) => [
      'drug_era.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'drug_era.person_id',
        'drug_era.drug_era_start_date',
      ),
    ]);
  if ((!a.first || _optimizeFirst) && distinct) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'drug_era.drug_concept_id',
      a.conceptset,
    );
  }

  if (a.startAge || a.endAge || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'drug_era.person_id',
      'person.person_id',
    );

    if (a.startAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'drug_era.drug_era_start_date',
        'person.year_of_birth',
        a.startAge,
      );
    }

    if (a.endAge) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'drug_era.drug_era_end_date',
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
      'drug_era.drug_era_start_date',
      a.startDate,
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      'drug_era.drug_era_end_date',
      a.endDate,
    );
  }

  if (a.length) {
    query = handleYearMinusWithNumberOperator(
      query,
      'drug_era.drug_era_end_date',
      'drug_era.drug_era_start_date',
      a.length,
    );
  }

  if (a.eraExposureCount) {
    query = handleNumberWithOperator(
      query,
      'drug_era.drug_exposure_count',
      a.eraExposureCount,
    );
  }

  if (a.first && !_optimizeFirst) {
    let finalQuery = db
      .selectFrom(query.as('filtered_drug_era'))
      .where('ordinal', '=', 1)
      .select('person_id');
    if (distinct) {
      finalQuery = finalQuery.distinct();
    }
    return finalQuery;
  }

  return query;
};
