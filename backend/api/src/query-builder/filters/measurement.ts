import { expressionBuilder } from "kysely";
import { MeasurementFilter } from "../../types/type";
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
  getExpressionBuilder,
} from "../base";
import { Kysely } from "kysely";
import { Database } from "../../db/types";

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (db: Kysely<Database>, a: MeasurementFilter) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref("first_measurement").as("measurement")
        : "measurement"
    )
    .select(({ fn }) => [
      "measurement.person_id as person_id",
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        "measurement.person_id",
        "measurement.measurement_date"
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      "measurement.measurement_concept_id",
      a.conceptset
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      "person",
      "measurement.person_id",
      "person.person_id"
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        "measurement.measurement_date",
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
    let joinedQuery = query.leftJoin(
      "visit_occurrence",
      "measurement.visit_occurrence_id",
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
    let joinedQuery = query.leftJoin(
      "provider",
      "measurement.provider_id",
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

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      "measurement.measurement_source_concept_id",
      a.source
    );
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as("filtered_measurement"))
      .where("ordinal", "=", 1)
      .select("person_id")
      .distinct();
  }

  return query;
};
