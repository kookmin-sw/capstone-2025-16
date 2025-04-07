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
import * as demographic from "./filters/demographic";
import { CohortDefinition, Concept, Filter } from "../types/type";
import { getBaseDB } from "./base";
import { Compilable, sql } from "kysely";
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

const handleFilter = (filter: Filter, prev_cohort_id: number) => {
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
    case "demographic":
      return demographic.getQuery(filter, prev_cohort_id);
    default:
      throw new Error(`Unknown filter type: ${filter}`);
  }
};

export const buildQuery = (
  cohortdef: CohortDefinition,
  database: "clickhouse" | "postgres" = "clickhouse"
) => {
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
        )
        .addColumn(
          "start_date",
          database === "clickhouse" ? sql`Date32` : "date"
        )
        .addColumn(
          "end_date",
          database === "clickhouse" ? sql`Date32` : "date"
        ),
    ],
  ];

  const cleanupQueries: (Compilable | Compilable[])[] = [
    [
      getBaseDB().schema.dropTable("codesets"),
      getBaseDB().schema.dropTable("temp_cohort_detail"),
    ],
  ];

  const { conceptsets, cohort } = cohortdef;

  if (conceptsets) {
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

  let cohortId = 2;
  if (cohort && cohort.length) {
    const [firstGroup, ...subsequentGroups] = cohort;

    // Process first group
    {
      let query: any[] = [];

      let [firstContainer, ...subsequentContainers] = firstGroup.containers;

      let firstContainerQuery;
      for (const filter of firstContainer.filters) {
        if (!firstContainerQuery) {
          firstContainerQuery = getBaseDB()
            .selectFrom(handleFilter(filter, 0).as("first_query"))
            .select(["person_id", "start_date", "end_date"]);
        } else {
          firstContainerQuery = firstContainerQuery.where(
            "person_id",
            "in",
            getBaseDB()
              .selectFrom(handleFilter(filter, 0).as("filter_query"))
              .select("person_id")
          );
        }
      }

      query.push(firstContainerQuery);

      for (const container of subsequentContainers) {
        let subsequentContainerQuery: any;
        for (const filter of container.filters) {
          if (!subsequentContainerQuery) {
            subsequentContainerQuery = getBaseDB()
              .selectFrom(handleFilter(filter, 0).as("subsequent_query"))
              .select(["person_id", "start_date", "end_date"]);
          } else {
            subsequentContainerQuery = subsequentContainerQuery.where(
              "person_id",
              "in",
              getBaseDB()
                .selectFrom(handleFilter(filter, 0).as("filter_query"))
                .select("person_id")
            );
          }
        }

        if (container.operator === "OR") {
          query.push(subsequentContainerQuery);
        } else if (
          container.operator === "AND" ||
          container.operator === "NOT"
        ) {
          query = query.map((e) =>
            e.where(
              "person_id",
              container.operator === "NOT" ? "not in" : "in",
              getBaseDB()
                .selectFrom(subsequentContainerQuery.as("subsequent_query"))
                .select("person_id")
            )
          );
        }
      }

      queries.push(
        query.map((e) =>
          getBaseDB()
            .insertInto("temp_cohort_detail")
            .expression(
              getBaseDB()
                .selectFrom(e)
                .select(({ eb }) => [
                  eb.fn<any>("_to_int64", [eb.val(1)]).as("cohort_id"),
                  "person_id",
                  "start_date",
                  "end_date",
                ])
            )
        )
      );
    }

    // Process subsequent groups
    for (const group of subsequentGroups) {
      let [firstContainer, ...subsequentContainers] = group.containers;

      let firstContainerQuery: any;
      for (const filter of firstContainer.filters) {
        if (!firstContainerQuery) {
          firstContainerQuery = getBaseDB()
            .selectFrom(handleFilter(filter, cohortId - 1).as("first_query"))
            .select("person_id");
        } else {
          firstContainerQuery = firstContainerQuery.where(
            "person_id",
            "in",
            getBaseDB()
              .selectFrom(handleFilter(filter, cohortId - 1).as("filter_query"))
              .select("person_id")
          );
        }
      }

      for (const container of subsequentContainers) {
        let subsequentContainerQuery: any;
        for (const filter of container.filters) {
          if (!subsequentContainerQuery) {
            subsequentContainerQuery = getBaseDB()
              .selectFrom(
                handleFilter(filter, cohortId - 1).as("subsequent_query")
              )
              .select("person_id");
          } else {
            subsequentContainerQuery = subsequentContainerQuery.where(
              "person_id",
              "in",
              getBaseDB()
                .selectFrom(
                  handleFilter(filter, cohortId - 1).as("filter_query")
                )
                .select("person_id")
            );
          }
        }

        if (container.operator === "OR") {
          firstContainerQuery = getBaseDB()
            .selectFrom(
              firstContainerQuery
                .unionAll(subsequentContainerQuery)
                .as("union_query")
            )
            .selectAll();
        } else if (container.operator === "AND") {
          firstContainerQuery = getBaseDB()
            .selectFrom(
              firstContainerQuery
                .intersect(subsequentContainerQuery)
                .as("intersect_query")
            )
            .selectAll();
        } else if (container.operator === "NOT") {
          firstContainerQuery = getBaseDB()
            .selectFrom(
              firstContainerQuery
                .except(subsequentContainerQuery)
                .as("except_query")
            )
            .selectAll();
        }
      }

      queries.push(
        getBaseDB()
          .insertInto("temp_cohort_detail")
          .expression(
            getBaseDB()
              .selectFrom("temp_cohort_detail")
              .select(({ eb }) => [
                eb.fn<any>("_to_int64", [eb.val(cohortId)]).as("cohort_id"),
                "person_id",
                "start_date",
                "end_date",
              ])
              .where(({ eb }) =>
                eb(
                  "cohort_id",
                  "=",
                  eb.fn<any>("_to_int64", [eb.val(cohortId - 1)])
                )
              )
              .where("person_id", "in", firstContainerQuery)
          )
      );
      cohortId++;
    }
  }

  queries.push([
    getBaseDB()
      .selectFrom("temp_cohort_detail")
      .groupBy("cohort_id")
      .orderBy("cohort_id", "asc")
      .select(({ fn }) => ["cohort_id", fn.count("person_id").as("count")]),
    getBaseDB()
      .insertInto("cohort_detail")
      .expression(
        getBaseDB()
          .selectFrom("temp_cohort_detail")
          .select(({ eb }) => [
            eb.fn<any>("_to_int64", [eb.val(1)]).as("cohort_id"), // TODO: 코호트 아이디 추가
            "person_id",
            "start_date",
            "end_date",
          ])
          .where(({ eb }) =>
            eb(
              "cohort_id",
              "=",
              eb.fn<any>("_to_int64", [eb.val(cohortId - 1)])
            )
          )
      ),
  ]);

  return [...queries, ...cleanupQueries];
};
