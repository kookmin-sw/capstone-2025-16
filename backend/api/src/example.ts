import { db } from "./db/types";

console.log(
  db.insertInto("concept").expression(db.selectFrom("concept")).compile()
);

console.log(
  db
    .selectFrom("concept")
    .select(({ fn, val, ref }) => [
      fn.avg("concept.concept_id").as("avg_concept_id"),
    ])
    .limit(10)
    .compile()
);
