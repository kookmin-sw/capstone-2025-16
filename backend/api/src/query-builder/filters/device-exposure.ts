import { DeviceExposureFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";
import { expressionBuilder, Kysely } from "kysely";
import { Database } from "../../db/types";

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: DeviceExposureFilter) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref("first_device_exposure").as("device_exposure")
        : "device_exposure"
    )
    .select(({ fn }) => [
      "device_exposure.person_id as person_id",
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        "device_exposure.person_id",
        "device_exposure.device_exposure_start_date"
      ),
    ]);

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "device_exposure.device_type_concept_id",
      a.conceptset
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      "person",
      "device_exposure.person_id",
      "person.person_id"
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "device_exposure.device_exposure_start_date",
        "person.year_of_birth",
        a.age
      );
    }

    if (a.gender) {
      joinedQuery = handleIdentifierWithOperator(
        joinedQuery,
        "person.gender_concept_id",
        a.gender
      );
    }

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      "device_exposure.device_exposure_start_date",
      a.startDate
    );
  }

  if (a.endDate) {
    query = handleDateWithOperator(
      query,
      "device_exposure.device_exposure_end_date",
      a.endDate
    );
  }

  if (a.deviceType) {
    query = handleIdentifierWithOperator(
      query,
      "device_exposure.device_type_concept_id",
      a.deviceType
    );
  }

  if (a.visitType) {
    let joinedQuery = query.leftJoin(
      "visit_occurrence",
      "device_exposure.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.uniqueDeviceId) {
    query = handleIdentifierWithOperator(
      query,
      "device_exposure.unique_device_id",
      a.uniqueDeviceId
    );
  }

  if (a.quantity) {
    query = handleNumberWithOperator(
      query,
      "device_exposure.quantity",
      a.quantity
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      "device_exposure.device_source_concept_id",
      a.source
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      "provider",
      "device_exposure.provider_id",
      "provider.provider_id"
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as("filtered_device_exposure"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
