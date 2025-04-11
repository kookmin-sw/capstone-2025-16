import { DeviceExposureFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

export const getQuery = (db: Kysely<Database>, a: DeviceExposureFilter) => {
  let query = db
    .selectFrom("device_exposure")
    .select(({ fn }) => [
      "device_exposure.person_id as person_id",
      ...handleRowNumber(
        a.first,
        fn,
        "device_exposure.person_id",
        "device_exposure.device_exposure_start_date"
      ),
    ])
    .leftJoin("person", "device_exposure.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "device_exposure.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin(
      "provider",
      "device_exposure.provider_id",
      "provider.provider_id"
    );

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "device_exposure.device_type_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "device_exposure.device_exposure_start_date",
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
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
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
    query = handleIdentifierWithOperator(
      query,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );
  }

  if (a.first) {
    return db
      .selectFrom(query.as("filtered_device_exposure"))
      .where("ordinal", "=", 1)
      .select("person_id");
  }

  return query;
};
