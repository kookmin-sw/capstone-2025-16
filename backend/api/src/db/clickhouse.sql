CREATE OR REPLACE FUNCTION _to_date AS (a) -> toDate32(a);

CREATE OR REPLACE FUNCTION _get_year AS (a) -> toYear(a);

CREATE OR REPLACE FUNCTION _nullif AS (a, b) -> nullIf(a, b);

CREATE OR REPLACE FUNCTION _ifnull AS (a, b) -> ifNull(a, b);

CREATE OR REPLACE FUNCTION _to_int64 AS (a) -> toInt64(a);


/* Create first_condition_era */
CREATE TABLE IF NOT EXISTS first_condition_era AS condition_era;
CREATE MATERIALIZED VIEW first_condition_era_mv
TO first_condition_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_era_start_date ASC) AS ordinal
    FROM condition_era
)
WHERE ordinal = 1;
INSERT INTO first_condition_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_era_start_date ASC) AS ordinal
    FROM condition_era
)
WHERE ordinal = 1;

/* Create first_condition_occurrence */
CREATE TABLE IF NOT EXISTS first_condition_occurrence AS condition_occurrence;
CREATE MATERIALIZED VIEW first_condition_occurrence_mv
TO first_condition_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_start_date ASC) AS ordinal
    FROM condition_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_condition_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_start_date ASC) AS ordinal
    FROM condition_occurrence
)
WHERE ordinal = 1;

/* Create first_device_exposure */
CREATE TABLE IF NOT EXISTS first_device_exposure AS device_exposure;
CREATE MATERIALIZED VIEW first_device_exposure_mv
TO first_device_exposure
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY device_exposure_start_date ASC) AS ordinal
    FROM device_exposure
)
WHERE ordinal = 1;
INSERT INTO first_device_exposure
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY device_exposure_start_date ASC) AS ordinal
    FROM device_exposure
)
WHERE ordinal = 1;

/* Create first_dose_era */
CREATE TABLE IF NOT EXISTS first_dose_era AS dose_era;
CREATE MATERIALIZED VIEW first_dose_era_mv
TO first_dose_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY dose_era_start_date ASC) AS ordinal
    FROM dose_era
)
WHERE ordinal = 1;
INSERT INTO first_dose_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY dose_era_start_date ASC) AS ordinal
    FROM dose_era
)
WHERE ordinal = 1;

/* Create first_drug_era */
CREATE TABLE IF NOT EXISTS first_drug_era AS drug_era;
CREATE MATERIALIZED VIEW first_drug_era_mv
TO first_drug_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_era_start_date ASC) AS ordinal
    FROM drug_era
)
WHERE ordinal = 1;
INSERT INTO first_drug_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_era_start_date ASC) AS ordinal
    FROM drug_era
)
WHERE ordinal = 1;

/* Create first_drug_exposure */
CREATE TABLE IF NOT EXISTS first_drug_exposure AS drug_exposure;
CREATE MATERIALIZED VIEW first_drug_exposure_mv
TO first_drug_exposure
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_exposure_start_date ASC) AS ordinal
    FROM drug_exposure
)
WHERE ordinal = 1;
INSERT INTO first_drug_exposure
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_exposure_start_date ASC) AS ordinal
    FROM drug_exposure
)
WHERE ordinal = 1;

/* Create first_observation */
CREATE TABLE IF NOT EXISTS first_observation AS observation;
CREATE MATERIALIZED VIEW first_observation_mv
TO first_observation
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_date ASC) AS ordinal
    FROM observation
)
WHERE ordinal = 1;
INSERT INTO first_observation
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_date ASC) AS ordinal
    FROM observation
)
WHERE ordinal = 1;

/* Create first_observation_period */
CREATE TABLE IF NOT EXISTS first_observation_period AS observation_period;
CREATE MATERIALIZED VIEW first_observation_period_mv
TO first_observation_period
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_period_start_date ASC) AS ordinal
    FROM observation_period
)
WHERE ordinal = 1;
INSERT INTO first_observation_period
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_period_start_date ASC) AS ordinal
    FROM observation_period
)
WHERE ordinal = 1;

/* Create first_procedure_occurrence */
CREATE TABLE IF NOT EXISTS first_procedure_occurrence AS procedure_occurrence;
CREATE MATERIALIZED VIEW first_procedure_occurrence_mv
TO first_procedure_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY procedure_date ASC) AS ordinal
    FROM procedure_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_procedure_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY procedure_date ASC) AS ordinal
    FROM procedure_occurrence
)
WHERE ordinal = 1;

/* Create first_specimen */
CREATE TABLE IF NOT EXISTS first_specimen AS specimen;
CREATE MATERIALIZED VIEW first_specimen_mv
TO first_specimen
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY specimen_date ASC) AS ordinal
    FROM specimen
)
WHERE ordinal = 1;
INSERT INTO first_specimen
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY specimen_date ASC) AS ordinal
    FROM specimen
)
WHERE ordinal = 1;

/* Create first_visit_occurrence */
CREATE TABLE IF NOT EXISTS first_visit_occurrence AS visit_occurrence;
CREATE MATERIALIZED VIEW first_visit_occurrence_mv
TO first_visit_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY visit_start_date ASC) AS ordinal
    FROM visit_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_visit_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY visit_start_date ASC) AS ordinal
    FROM visit_occurrence
)
WHERE ordinal = 1;

/* Create first_measurement */
CREATE TABLE IF NOT EXISTS first_measurement AS measurement;
CREATE MATERIALIZED VIEW first_measurement_mv
TO first_measurement
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY measurement_date ASC) AS ordinal
    FROM measurement
)
WHERE ordinal = 1;
INSERT INTO first_measurement
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY measurement_date ASC) AS ordinal
    FROM measurement
)
WHERE ordinal = 1;

