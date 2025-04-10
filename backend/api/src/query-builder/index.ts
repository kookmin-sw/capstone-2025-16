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
// import * as demographic from "./filters/demographic";
import { CohortDefinition, Concept, Filter } from "../types/type";
import { getBaseDB } from "./base";
import { Compilable, SelectQueryBuilder, sql } from "kysely";
import { format } from "sql-formatter";
import { Database } from "../db/types";

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

const handleFilter = (filter: Filter) => {
  switch (filter.type) {
    case "condition_era":
      return conditionEra.getQuery(filter);
    case "condition_occurrence":
      return conditionOccurrence.getQuery(filter);
    case "death":
      return death.getQuery(filter);
    case "device_exposure":
      return deviceExposure.getQuery(filter);
    case "dose_era":
      return doseEra.getQuery(filter);
    case "drug_era":
      return drugEra.getQuery(filter);
    case "drug_exposure":
      return drugExposure.getQuery(filter);
    case "measurement":
      return measurement.getQuery(filter);
    case "observation":
      return observation.getQuery(filter);
    case "observation_period":
      return observationPeriod.getQuery(filter);
    case "procedure_occurrence":
      return procedureOccurrence.getQuery(filter);
    case "specimen":
      return specimen.getQuery(filter);
    case "visit_occurrence":
      return visitOccurrence.getQuery(filter);
    // case "demographic":
    //   return demographic.getQuery(filter);
    default:
      throw new Error(`Unknown filter type: ${filter}`);
  }
};

export const buildQuery = (options: {
  cohortId?: string;
  cohortDef: CohortDefinition;
  database?: "clickhouse" | "postgres";
}) => {
  let { cohortId, cohortDef, database } = options;
  database = database || "clickhouse";

  const queries: (Compilable | Compilable[])[] = [
    [
      getBaseDB()
        .schema.createTable("codesets")
        .temporary()
        .addColumn(
          "codeset_id",
          database === "clickhouse" ? sql`Int64` : "bigint"
        )
        .addColumn(
          "concept_id",
          database === "clickhouse" ? sql`Int64` : "bigint"
        ),
      getBaseDB()
        .schema.createTable("temp_cohort_detail")
        .temporary()
        .addColumn(
          "cohort_id",
          database === "clickhouse" ? sql`Int64` : "bigint"
        )
        .addColumn(
          "person_id",
          database === "clickhouse" ? sql`Int64` : "bigint"
        ),
    ],
  ];

  const cleanupQueries: (Compilable | Compilable[])[] = [
    [
      getBaseDB().schema.dropTable("codesets"),
      getBaseDB().schema.dropTable("temp_cohort_detail"),
    ],
  ];

  const { conceptsets, initialGroup, comparisonGroup } = cohortDef;

  if (conceptsets && conceptsets.length) {
    conceptsets.map((e) => {
      queries.push(
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

  // handle initial group
  for (let i = 0; i < initialGroup.containers.length; i++) {
    let container = initialGroup.containers[i];
    let query: SelectQueryBuilder<Database, any, any> | undefined;
    for (let filter of container.filters) {
      if (!query) {
        query = handleFilter(filter);
      } else {
        query = query.intersect(handleFilter(filter));
      }
    }

    if (!query) continue;

    switch ("operator" in container && container.operator) {
      case "AND":
        query = getBaseDB()
          .selectFrom("temp_cohort_detail")
          .select("person_id")
          .where(({ eb }) =>
            eb("cohort_id", "=", eb.fn<any>("_to_int64", [eb.val(i)]))
          )
          .where("person_id", "in", query);
        break;
      case "OR":
        query = getBaseDB()
          .selectFrom("temp_cohort_detail")
          .select("person_id")
          .where(({ eb }) =>
            eb("cohort_id", "=", eb.fn<any>("_to_int64", [eb.val(i)]))
          )
          .union(query);
        break;
      case "NOT":
        query = getBaseDB()
          .selectFrom("temp_cohort_detail")
          .select("person_id")
          .where(({ eb }) =>
            eb("cohort_id", "=", eb.fn<any>("_to_int64", [eb.val(i)]))
          )
          .except(query);
        break;
      default:
        break;
    }

    queries.push(
      getBaseDB()
        .insertInto("temp_cohort_detail")
        .expression(
          getBaseDB()
            .selectFrom(query.as("tmp"))
            .select(({ eb }) => [
              eb.fn<any>("_to_int64", [eb.val(i + 1)]).as("cohort_id"),
              "person_id",
            ])
        )
    );
  }

  // handle comparison group
  if (comparisonGroup) {
    for (let i = 0; i < comparisonGroup.containers.length; i++) {
      let container = comparisonGroup.containers[i];
      let query: SelectQueryBuilder<Database, any, any> | undefined;
      for (let filter of container.filters) {
        if (!query) {
          query = handleFilter(filter);
        } else {
          query = query.intersect(handleFilter(filter));
        }
      }

      if (!query) continue;

      switch ("operator" in container && container.operator) {
        case "AND":
          query = getBaseDB()
            .selectFrom("temp_cohort_detail")
            .select("person_id")
            .where(({ eb }) =>
              eb(
                "cohort_id",
                "=",
                eb.fn<any>("_to_int64", [
                  eb.val(initialGroup.containers.length + i),
                ])
              )
            )
            .where("person_id", "in", query);
          break;
        case "OR":
          query = getBaseDB()
            .selectFrom("temp_cohort_detail")
            .select("person_id")
            .where(({ eb }) =>
              eb(
                "cohort_id",
                "=",
                eb.fn<any>("_to_int64", [
                  eb.val(initialGroup.containers.length + i),
                ])
              )
            )
            .union(
              getBaseDB()
                .selectFrom("temp_cohort_detail")
                .select("person_id")
                .where(({ eb }) =>
                  eb(
                    "cohort_id",
                    "=",
                    eb.fn<any>("_to_int64", [
                      eb.val(initialGroup.containers.length),
                    ])
                  )
                )
                .where("person_id", "in", query)
            );
          break;
        case "NOT":
          query = getBaseDB()
            .selectFrom("temp_cohort_detail")
            .select("person_id")
            .where(({ eb }) =>
              eb(
                "cohort_id",
                "=",
                eb.fn<any>("_to_int64", [
                  eb.val(initialGroup.containers.length + i),
                ])
              )
            )
            .except(query);
          break;
        default:
          query = getBaseDB()
            .selectFrom("temp_cohort_detail")
            .select("person_id")
            .where(({ eb }) =>
              eb(
                "cohort_id",
                "=",
                eb.fn<any>("_to_int64", [
                  eb.val(initialGroup.containers.length),
                ])
              )
            )
            .where("person_id", "in", query);
          break;
      }

      queries.push(
        getBaseDB()
          .insertInto("temp_cohort_detail")
          .expression(
            getBaseDB()
              .selectFrom(query.as("tmp"))
              .select(({ eb }) => [
                eb
                  .fn<any>("_to_int64", [
                    eb.val(initialGroup.containers.length + i + 1),
                  ])
                  .as("cohort_id"),
                "person_id",
              ])
          )
      );
    }
  }

  const finalQueries: Compilable[] = [
    getBaseDB()
      .selectFrom("temp_cohort_detail")
      .groupBy("cohort_id")
      .orderBy("cohort_id", "asc")
      .select(({ fn }) => [
        "cohort_id as container_id",
        fn.count("person_id").as("count"),
      ]),
  ];

  if (cohortId) {
    finalQueries.push(
      getBaseDB()
        .insertInto("cohort_detail")
        .expression(
          getBaseDB()
            .selectFrom(
              getBaseDB()
                .selectFrom("temp_cohort_detail")
                .select("person_id")
                .where(({ eb }) =>
                  eb(
                    "cohort_id",
                    "=",
                    eb.fn<any>("_to_int64", [
                      eb.val(
                        initialGroup.containers.length +
                          (comparisonGroup?.containers.length ?? 0)
                      ),
                    ])
                  )
                )
                .as("tmp")
            )
            .select(({ eb }) => [eb.val(cohortId).as("cohort_id"), "person_id"])
        )
    );
  }

  queries.push(finalQueries);

  return [...queries, ...cleanupQueries];
};
