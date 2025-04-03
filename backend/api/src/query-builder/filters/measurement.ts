import { expressionBuilder } from "kysely";
import { MeasurementFilter } from "../types/type";
import {
  getBaseDB,
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
  getExpressionBuilder,
} from "./base";

export const getQuery = (a: MeasurementFilter) => {
  let query = getBaseDB()
    .selectFrom("measurement")
    .select(({ fn }) => [
      "measurement.person_id as person_id",
      "measurement.measurement_date as start_date",
      "measurement.measurement_date as end_date",
      ...handleRowNumber(
        a.first,
        fn,
        "measurement.person_id",
        "measurement.measurement_date"
      ),
    ])
    .leftJoin("person", "measurement.person_id", "person.person_id")
    .leftJoin(
      "visit_occurrence",
      "measurement.visit_occurrence_id",
      "visit_occurrence.visit_occurrence_id"
    )
    .leftJoin("provider", "measurement.provider_id", "provider.provider_id");

  if (a.conceptset) {
    query = handleConceptSet(
      query,
      "measurement.measurement_concept_id",
      a.conceptset
    );
  }

  if (a.age) {
    query = handleAgeWithNumberOperator(
      query,
      "measurement.measurement_date",
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

  if (a.date) {
    query = handleDateWithOperator(
      query,
      "measurement.measurement_date",
      a.date
    );
  }

  if (a.measurementType) {
    query = handleIdentifierWithOperator(
      query,
      "measurement.measurement_type_concept_id",
      a.measurementType
    );
  }

  if (a.visitType) {
    query = handleIdentifierWithOperator(
      query,
      "visit_occurrence.visit_concept_id",
      a.visitType
    );
  }

  if (a.operatorType) {
    query = handleIdentifierWithOperator(
      query,
      "measurement.operator_concept_id",
      a.operatorType
    );
  }

  if (a.valueAsNumber) {
    query = handleNumberWithOperator(
      query,
      "measurement.value_as_number",
      a.valueAsNumber
    );
  }

  if (a.valueAsConcept) {
    query = handleIdentifierWithOperator(
      query,
      "measurement.value_as_concept_id",
      a.valueAsConcept
    );
  }

  if (a.unitType) {
    query = handleIdentifierWithOperator(
      query,
      "measurement.unit_concept_id",
      a.unitType
    );
  }

  if (a.abnormal) {
    const eb = getExpressionBuilder(query);
    query = query.where(
      eb.or([
        eb("measurement.value_as_number", ">", eb.ref("measurement.range_low")),
        eb(
          "measurement.value_as_number",
          "<",
          eb.ref("measurement.range_high")
        ),
        eb(
          "measurement.value_as_concept_id",
          "in",
          // @ts-ignore
          ["4155142", "4155143"].map((e) => eb.fn("_to_int64", [eb.val(e)]))
        ),
      ])
    );
  }

  if (a.rangeLow) {
    query = handleNumberWithOperator(
      query,
      "measurement.range_low",
      a.rangeLow
    );
  }

  if (a.rangeHigh) {
    query = handleNumberWithOperator(
      query,
      "measurement.range_high",
      a.rangeHigh
    );
  }

  if (a.providerSpecialty) {
    query = handleIdentifierWithOperator(
      query,
      "provider.specialty_concept_id",
      a.providerSpecialty
    );
  }

  if (a.source) {
    query = handleConceptSet(
      query,
      "measurement.measurement_source_concept_id",
      a.source
    );
  }

  if (a.first) {
    return getBaseDB()
      .selectFrom(query.as("filtered_measurement"))
      .where("ordinal", "=", 1)
      .select(["person_id", "start_date", "end_date"]);
  }

  return query;
};
