import { DrugExposureFilter } from "../../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleStringWithOperator,
  handleConceptSet,
} from "../base";

export const getQuery = (a: DrugExposureFilter) => {
  let query = getBaseDB()
    .selectFrom("drug_exposure")
    .select(({ fn }) => [
      "drug_exposure.person_id as person_id",
      "drug_exposure.drug_exposure_start_date as start_date",
      "drug_exposure.drug_exposure_end_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "drug_exposure.person_id",
        "drug_exposure.drug_exposure_start_date"
      ),
    ])
    .leftJoin("person", "drug_exposure.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "drug_exposure.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin("provider", "drug_exposure.provider_id", "provider.provider_id");

  if (a.conceptset) {
    query = handleConceptSet(
      query,
      "drug_exposure.drug_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "drug_exposure.drug_exposure_start_date",
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

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      "drug_exposure.drug_exposure_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "drug_exposure.drug_exposure_end_date",
      a.endDate
    );
  }

  if (a.drugType) {
    query = handleIdentifierWithOperator(
      query,
      "drug_exposure.drug_type_concept_id",
      a.drugType
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.stopReason) {
    query = handleStringWithOperator(
      query,
      "drug_exposure.stop_reason",
      a.stopReason
    );
  }

  if (a.refill) {
    query = handleNumberWithOperator(query, "drug_exposure.refills", a.refill);
  }

  if (a.quantity) {
    query = handleNumberWithOperator(
      query,
      "drug_exposure.quantity",
      a.quantity
    );
  }

  if (a.daysSupply) {
    query = handleNumberWithOperator(
      query,
      "drug_exposure.days_supply",
      a.daysSupply
    );
  }

  if (a.routeType) {
    query = handleIdentifierWithOperator(
      query,
      "drug_exposure.route_concept_id",
      a.routeType
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
      "drug_exposure.lot_number",
      a.lotNumber
    );
  }

  if (a.source) {
    query = handleConceptSet(
      query,
      "drug_exposure.drug_source_concept_id",
      a.source
    );
  }

  if (a.providerSpecialty) {
    query = handleIdentifierWithOperator(
      query,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );
  }

  if (a.first) {
    return getBaseDB()
      .selectFrom(query.as("filtered_drug_exposure"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
