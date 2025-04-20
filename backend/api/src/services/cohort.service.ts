import { HttpResponse } from "../helpers/response.helper";
import { getBaseDB } from "../query-builder/base";
import { CohortDefinition } from "../types/type";
import { uuidv7 } from "uuidv7";
import { buildQuery } from "../query-builder";

export const getCohorts = async (page: number) => {
  const limit = 50;

  return new HttpResponse(
    200,
    await getBaseDB()
      .selectFrom("cohort")
      .selectAll()
      .limit(limit)
      .offset(page * limit)
      .execute()
  );
};

export const getCohortStatistics = async (id: string) => {
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

  let [gender, mortality, age] = await Promise.all([
    getBaseDB() // gender
      .selectFrom("cohort_detail")
      .where("cohort_id", "=", id)
      .leftJoin("person", "person.person_id", "cohort_detail.person_id")
      .leftJoin("concept", "concept.concept_id", "person.gender_concept_id")
      .groupBy(["concept.concept_id", "concept.concept_name"])
      .select(({ fn }) => [
        "concept.concept_id",
        "concept.concept_name",
        fn.count("person.person_id").as("count"),
      ])
      .execute(),
    getBaseDB() // mortality
      .selectFrom("cohort_detail")
      .where("cohort_id", "=", id)
      .leftJoin("death", "death.person_id", "cohort_detail.person_id")
      .select(({ eb, fn }) => [
        eb(
          fn.count("cohort_detail.person_id"),
          "-",
          fn.count("death.person_id")
        ).as("alive"),
        fn.count("death.person_id").as("deceased"),
      ])
      .executeTakeFirst(),
    getBaseDB() // age
      .selectFrom(
        getBaseDB()
          .selectFrom("cohort_detail")
          .where("cohort_id", "=", id)
          .leftJoin("person", "person.person_id", "cohort_detail.person_id")
          .select(({ eb, fn }) => [
            eb(
              eb.ref("person.year_of_birth"),
              "-",
              eb.fn<number>("_get_year", [eb.fn("now")])
            ).as("age"),
          ])
          .as("tmp")
      )
      .groupBy(({ eb, fn }) => [fn("floor", [eb(eb.ref("age"), "/", 10)])])
      .select(({ eb, fn }) => [
        eb(fn("floor", [eb(eb.ref("age"), "/", 10)]), "*", 10).as("age_start"),
        eb(eb(fn("floor", [eb(eb.ref("age"), "/", 10)]), "*", 10), "+", 9).as(
          "age_end"
        ),
        fn.count("age").as("count"),
      ])
      .execute(),
  ]);

  age.sort((a, b) => Number(a.age_start) - Number(b.age_start));
  let age_range: { [key: string]: number } = {};
  for (let { age_start, age_end, count } of age) {
    age_range[`${age_start}-${age_end}`] = Number(count);
  }

  return new HttpResponse(200, {
    gender,
    mortality,
    age,
  });
};

export const getCohortPersons = async (id: string, page: number) => {
  let cohort = await getBaseDB()
    .selectFrom("cohort")
    .select("cohort_id")
    .where("cohort_id", "=", id)
    .executeTakeFirst();

  if (!cohort) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  const limit = 50;

  let cohortDetail = await getBaseDB()
    .selectFrom("cohort_detail")
    .select("person_id")
    .where("cohort_id", "=", id) // TODO: join person?
    .limit(limit)
    .offset(page * limit)
    .execute();

  return new HttpResponse(
    200,
    cohortDetail.map((e) => e.person_id)
  );
};

export const getCohort = async (id: string) => {
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

export const createNewCohort = async (
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

export const updateExistingCohort = async (
  cohortId: string,
  name?: string,
  description?: string,
  cohortDef?: CohortDefinition
) => {
  let cohort = await getBaseDB()
    .selectFrom("cohort")
    .selectAll()
    .where("cohort_id", "=", cohortId)
    .executeTakeFirst();

  if (!cohort) {
    return new HttpResponse(404, {
      message: "Cohort not found",
    });
  }

  await getBaseDB()
    .updateTable("cohort")
    .set({
      name: name ?? cohort.name,
      description: description ?? cohort.description,
      cohort_definition: cohortDef
        ? JSON.stringify(cohortDef)
        : cohort.cohort_definition,
      updated_at: new Date().toISOString(),
    })
    .where("cohort_id", "=", cohortId)
    .execute();

  return new HttpResponse(200, {
    message: "Cohort updated successfully",
  });
};

export const removeExistingCohort = async (id: string) => {
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

  await getBaseDB()
    .deleteFrom("cohort_detail")
    .where("cohort_id", "=", id)
    .execute();

  await getBaseDB().deleteFrom("cohort").where("cohort_id", "=", id).execute();

  return new HttpResponse(200, {
    message: "Cohort deleted successfully",
  });
};
