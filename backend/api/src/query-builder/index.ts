import * as conditionEra from "./filters/condition-era";
import * as conditionOccurrence from "./filters/condition-occurrence";
import * as death from "./filters/death";
import * as deviceExposure from "./filters/device-exposure";
import * as doseEra from "./filters/dose-era";
import * as drugEra from "./filters/drug-era";
import * as drugExposure from "./filters/drug-exposure";
import * as measurement from "./filters/measurement";
import * as observation from "./filters/observation";
import * as observationPeriod from "./filters/observation-period";
import * as procedureOccurrence from "./filters/procedure-occurrence";
import * as specimen from "./filters/specimen";
import * as visitOccurrence from "./filters/visit-occurrence";
import { CohortDefinition, ConceptSet, Concept } from "../types/type";
import { getBaseDB, getExpressionBuilder } from "./base";
import { Compilable } from "kysely";
import { format } from "sql-formatter";

const buildConceptQuery = (concepts: Concept[]) => {
  if (!concepts.length) {
    return getBaseDB()
      .selectFrom("concept")
      .select("concept.concept_id")
      .where(({ eb }) => eb(eb.val(1), "=", eb.val(0)));
  }

  let query = getBaseDB()
    .selectFrom("concept")
    .select("concept.concept_id")
    .where(({ eb }) =>
      eb(
        "concept.concept_id",
        "in",
        concepts.map((e) => eb.fn<any>("_to_int64", [eb.val(e.concept_id)]))
      )
    );

  let descendant = concepts.filter((e) => e.includeDescendants);
  if (descendant.length) {
    query = query.unionAll(
      getBaseDB()
        .selectFrom("concept")
        .select("concept.concept_id")
        .leftJoin(
          "concept_ancestor",
          "concept.concept_id",
          "concept_ancestor.descendant_concept_id"
        )
        .where(({ eb, and }) =>
          and([
            eb(
              "concept_ancestor.ancestor_concept_id",
              "in",
              descendant.map((e) =>
                eb.fn<any>("_to_int64", [eb.val(e.concept_id)])
              )
            ),
            eb("concept.invalid_reason", "is", null),
          ])
        )
    );
  }

  let mapped = concepts.filter((e) => e.includeMapped);
  if (mapped.length) {
    query = query.unionAll(
      // @ts-ignore
      getBaseDB()
        .selectFrom(query.as("concept_mapped"))
        .leftJoin(
          "concept_relationship",
          "concept_mapped.concept_id",
          "concept_relationship.concept_id_2"
        )
        .select("concept_relationship.concept_id_1 as concept_id")
        .where("relationship_id", "=", "Maps to")
        .where("invalid_reason", "is", null)
        .where(({ eb, and }) =>
          and([
            eb(
              "concept_mapped.concept_id",
              "in",
              mapped.map((e) => eb.fn<any>("_to_int64", [eb.val(e.concept_id)]))
            ),
          ])
        )
    );
  }

  return query;
};

export const buildQuery = (cohort: CohortDefinition) => {
  const query: Compilable[] = [
    getBaseDB()
      .schema.createTable("codesets")
      .temporary()
      .addColumn("codeset_id", "bigint") // bigint is compatible with clickhouse
      .addColumn("concept_id", "bigint"),
  ];

  if (cohort.conceptsets) {
    cohort.conceptsets.map((e) => {
      query.push(
        getBaseDB()
          .insertInto("codesets")
          .columns(["codeset_id", "concept_id"])
          .expression(
            getBaseDB()
              .selectFrom(
                buildConceptQuery(e.items.filter((e) => !e.isExcluded)).as(
                  "concept_include"
                )
              )
              .select(({ eb }) => [
                eb
                  .fn<any>("_to_int64", [eb.val(e.conceptset_id)])
                  .as("codeset_id"),
                "concept_include.concept_id",
              ])
              .distinctOn(["concept_include.concept_id"])
              .leftJoin(
                buildConceptQuery(e.items.filter((e) => e.isExcluded)).as(
                  "concept_exclude"
                ),
                "concept_include.concept_id",
                "concept_exclude.concept_id"
              )
              .where(({ eb }) =>
                eb(
                  "concept_exclude.concept_id",
                  "=",
                  eb.fn<any>("_to_int64", [eb.val("0")])
                )
              )
          )
      );
    });
  }

  return query;
};
