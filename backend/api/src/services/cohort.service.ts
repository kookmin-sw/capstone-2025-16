import { HttpResponse } from "../helpers/response.helper";
import { getBaseDB } from "../query-builder/base";
import { CohortDefinition } from "../types/type";
import { uuidv7 } from "uuidv7";
import { buildQuery } from "../query-builder";
import moment from "moment";
export const getAllCohorts = async () => {
  // TODO: pagenation?

  return new HttpResponse(
    200,
    await getBaseDB().selectFrom("cohort").selectAll().execute()
  );
};

export const getCohortDetailsById = async (id: string) => {
  // TODO: pagenation?

  let cohort = await getBaseDB()
    .selectFrom("cohort")
    .select("cohort_id")
    .where("cohort_id", "=", id)
    .execute();

  if (!cohort || cohort.length === 0) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  let cohortDetail = await getBaseDB()
    .selectFrom("cohort_detail")
    .select("person_id")
    .where("cohort_id", "=", id)
    .execute();

  return new HttpResponse(
    200,
    cohortDetail.map((e) => e.person_id)
  );
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
  const cohort = await getBaseDB()
    .selectFrom("cohort")
    .select("cohort_id")
    .where("cohort_id", "=", cohortId)
    .execute();
  if (cohort.length === 0) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  await getBaseDB()
    .updateTable("cohort")
    .set({
      name,
      description,
      cohort_definition: cohortDef && JSON.stringify(cohortDef),
      updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
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
  const cohort = await getBaseDB()
    .selectFrom("cohort")
    .select("cohort_id")
    .where("cohort_id", "=", id)
    .execute();

  if (!cohort || cohort.length === 0) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  await getBaseDB().deleteFrom("cohort").where("cohort_id", "=", id).execute();
  await getBaseDB()
    .deleteFrom("cohort_detail")
    .where("cohort_id", "=", id)
    .execute();

  return new HttpResponse(204);
};
