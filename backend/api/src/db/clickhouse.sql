CREATE OR REPLACE FUNCTION _to_date AS (a) -> toDate32(a);

CREATE OR REPLACE FUNCTION _get_year AS (a) -> toYear(a);

CREATE OR REPLACE FUNCTION _nullif AS (a, b) -> nullIf(a, b);

CREATE OR REPLACE FUNCTION _ifnull AS (a, b) -> ifNull(a, b);

CREATE OR REPLACE FUNCTION _to_int64 AS (a) -> toInt64(a);

CREATE TABLE IF NOT EXISTS first_condition_era AS condition_era;
CREATE MATERIALIZED VIEW first_condition_era_mv
TO first_condition_era
AS SELECT *
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_era_start_date ASC) AS ordinal
    FROM condition_era
)
WHERE ordinal = 1;

CREATE TABLE IF NOT EXISTS first_measurement AS measurement;
CREATE MATERIALIZED VIEW first_measurement_mv
TO first_measurement
AS SELECT *
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY measurement_date ASC) AS ordinal
    FROM measurement
)
WHERE ordinal = 1;