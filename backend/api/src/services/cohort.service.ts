import { HttpResponse } from "../helpers/response.helper";
import { getBaseDB } from "../query-builder/base";
import { CohortDefinition } from "../types/type";
import { uuidv7 } from "uuidv7";
import { buildQuery } from "../query-builder";

export const getAllCohorts = async () => {
  return new HttpResponse(
    200,
    await getBaseDB().selectFrom("cohort").selectAll().execute()
  );
};

export const getCohortById = async (id: string) => {
  let cohort = await getBaseDB()
    .selectFrom("cohort")
    .selectAll()
    .where("cohort_id", "=", id)
    .executeTakeFirst();

  if (!cohort) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  return new HttpResponse(200, cohort);
};

export const createCohort = async (
  name?: string,
  description?: string,
  cohortDef?: CohortDefinition,
  temporary?: boolean
) => {
  let cohortId: string | undefined;
  if (!temporary) {
    cohortId = uuidv7();
    await getBaseDB()
      .insertInto("cohort")
      .values({
        cohort_id: cohortId,
        name: name!,
        description: description!,
        cohort_definition: JSON.stringify(cohortDef),
        author: "00000000-0000-0000-0000-000000000000", // TODO: add author
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();
  }

  let arr: number[] = [];
  if (cohortDef) {
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        const queries = buildQuery(db, {
          cohortId,
          cohortDef,
          database: process.env.DB_TYPE,
        });

        for (let query of queries.flat()) {
          let result = await query.execute();
          if ("select" in query) {
            // container person counts
            arr = Array(
              cohortDef.initialGroup.containers.length +
                (cohortDef.comparisonGroup?.containers.length ?? 0)
            ).fill(0);

            for (let { container_id, count } of result as {
              container_id: string;
              count: string;
            }[]) {
              arr[Number.parseInt(container_id) - 1] = Number.parseInt(count);
            }
          }
        }
      });
  }

  return new HttpResponse(201, {
    message: "Cohort created successfully",
    cohortId,
    containerCounts: arr,
  });
};

export const updateCohort = async (
  cohortId: string,
  name?: string,
  description?: string,
  cohortDef?: CohortDefinition
) => {
  let result = await getBaseDB()
    .updateTable("cohort")
    .set({
      ...(name && { name }),
      ...(description && { description }),
      ...(cohortDef && { cohort_definition: JSON.stringify(cohortDef) }),
      updated_at: new Date().toISOString(),
    })
    .where("cohort_id", "=", cohortId)
    .execute();

  let arr: number[] = [];
  if (cohortDef) {
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        const queries = buildQuery(db, {
          cohortId,
          cohortDef,
          database: process.env.DB_TYPE,
        });

        for (let query of queries.flat()) {
          let result = await query.execute();
          if ("select" in query) {
            // container person counts
            arr = Array(
              cohortDef.initialGroup.containers.length +
                (cohortDef.comparisonGroup?.containers.length ?? 0)
            ).fill(0);

            for (let { container_id, count } of result as {
              container_id: string;
              count: string;
            }[]) {
              arr[Number.parseInt(container_id) - 1] = Number.parseInt(count);
            }
          }
        }
      });
  }

  return new HttpResponse(200, {
    message: "Cohort updated successfully",
    containerCounts: arr,
  });
};

export const deleteCohort = async (id: string) => {
  let result = await getBaseDB()
    .deleteFrom("cohort")
    .where("cohort_id", "=", id)
    .execute();

  if (result.length === 0 || result[0].numDeletedRows === 0n) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  return new HttpResponse(204);
};
