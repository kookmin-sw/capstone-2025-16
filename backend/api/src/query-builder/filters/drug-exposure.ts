import { DrugExposureFilter } from '../../types/type';
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

export const getQuery = (db: Kysely<Database>, a: DrugExposureFilter) => {
  let query = db
    .selectFrom(
      getOptimizedTable(
        _optimizeFirst && a.first,
        'drug_exposure',
        'first_drug_exposure',
      ),
    )
    .select(({ fn }) => [
      'drug_exposure.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'drug_exposure.person_id',
        'drug_exposure.drug_exposure_start_date',
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'drug_exposure.drug_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'drug_exposure.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'drug_exposure.drug_exposure_start_date',
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
      'drug_exposure.drug_exposure_start_date',
      a.startDate,
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      'drug_exposure.drug_exposure_end_date',
      a.endDate,
    );
  }

  if (a.drugType) {
    query = handleIdentifierWithOperator(
      query,
      'drug_exposure.drug_type_concept_id',
      a.drugType,
    );
  }

  if (a.visitType) {
    let joinedQuery = query.leftJoin(
      'visit_occurrence',
      'drug_exposure.visit_occurrence_id',
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

  if (a.stopReason) {
    query = handleStringWithOperator(
      query,
      'drug_exposure.stop_reason',
      a.stopReason,
    );
  }

  if (a.refill) {
    query = handleNumberWithOperator(query, 'drug_exposure.refills', a.refill);
  }

  if (a.quantity) {
    query = handleNumberWithOperator(
      query,
      'drug_exposure.quantity',
      a.quantity,
    );
  }

  if (a.daysSupply) {
    query = handleNumberWithOperator(
      query,
      'drug_exposure.days_supply',
      a.daysSupply,
    );
  }

  if (a.routeType) {
    query = handleIdentifierWithOperator(
      query,
      'drug_exposure.route_concept_id',
      a.routeType,
    );
  }

  // TODO: CDM 버전문제? 확인 필요
  //   if (a.effectiveDose) {
  //     query = handleNumberWithOperator(
  //       query,
  //       "drug_exposure.effective_dose",
  //       a.effectiveDose
  //     );
  //   }

  //   if (a.doseUnit) {
  //     query = handleIdentifierWithOperator(
  //       query,
  //       "drug_exposure.dose_unit_concept_id",
  //       a.doseUnit
  //     );
  //   }

  if (a.lotNumber) {
    query = handleStringWithOperator(
      query,
      'drug_exposure.lot_number',
      a.lotNumber,
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      'drug_exposure.drug_source_concept_id',
      a.source,
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      'provider',
      'drug_exposure.provider_id',
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
      .selectFrom(query.as('filtered_drug_exposure'))
      .where('ordinal', '=', 1)
      .select('person_id')
      .distinct();
  }

  return query;
};
