CREATE TABLE IF NOT EXISTS `condition_era` (
    `condition_era_id` Int64,
    `person_id` Int64,
    `condition_concept_id` Int64,
    `condition_era_start_date` Date32,
    `condition_era_end_date` Date32,
    `condition_occurrence_count` Nullable(Int64)
)
ORDER BY (`condition_era_start_date`, `condition_era_end_date`, `condition_era_id`);

CREATE TABLE IF NOT EXISTS `drug_era` (
    `drug_era_id` Int64,
    `person_id` Int64,
    `drug_concept_id` Int64,
    `drug_era_start_date` Date32,
    `drug_era_end_date` Date32,
    `drug_exposure_count` Nullable(Int64),
    `gap_days` Nullable(Int64)
)
ORDER BY (`drug_era_start_date`, `drug_era_end_date`, `drug_era_id`);

CREATE TABLE IF NOT EXISTS `dose_era` (
    `dose_era_id` Int64,
    `person_id` Int64,
    `drug_concept_id` Int64,
    `unit_concept_id` Int64,
    `dose_value` Float64,
    `dose_era_start_date` Date32,
    `dose_era_end_date` Date32
)
ORDER BY (`dose_era_start_date`, `dose_era_end_date`, `dose_era_id`);

CREATE TABLE IF NOT EXISTS `concept` (
    `concept_id` Int64,
    `concept_name` String,
    `domain_id` LowCardinality(String),
    `vocabulary_id` LowCardinality(String),
    `concept_class_id` LowCardinality(String),
    `standard_concept` LowCardinality(Nullable(String)),
    `concept_code` String,
    `valid_start_date` Date32,
    `valid_end_date` Date32,
    `invalid_reason` LowCardinality(Nullable(String))
)
ORDER BY `concept_id`;


CREATE TABLE IF NOT EXISTS `concept_relationship` (
    `concept_id_1` Int64,
    `concept_id_2` Int64,
    `relationship_id` LowCardinality(String),
    `valid_start_date` Date32,
    `valid_end_date` Date32,
    `invalid_reason` LowCardinality(Nullable(String)),
    PROJECTION projection_concept_id_2 (
        SELECT * ORDER BY (`relationship_id`, `concept_id_2`, `concept_id_1`)
    )
)
ORDER BY (`concept_id_1`, `concept_id_2`);

CREATE TABLE IF NOT EXISTS `condition_occurrence` (
    `condition_occurrence_id` Int64,
    `person_id` Int64,
    `condition_concept_id` Int64,
    `condition_start_date` Date32,
    `condition_start_datetime` Nullable(DateTime64),
    `condition_end_date` Date32,
    `condition_end_datetime` Nullable(DateTime64),
    `condition_type_concept_id` Int64,
    `condition_status_concept_id` Nullable(Int64),
    `stop_reason` LowCardinality(Nullable(String)),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `condition_source_value` LowCardinality(Nullable(String)),
    `condition_source_concept_id` Nullable(Int64),
    `condition_status_source_value` Nullable(String)
)
ORDER BY (`condition_start_date`, `condition_end_date`, `condition_occurrence_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `death` (
    `person_id` Int64,
    `death_date` Date32,
    `death_datetime` Nullable(DateTime64),
    `death_type_concept_id` Nullable(Int64),
    `cause_concept_id` Nullable(Int64),
    `cause_source_value` Nullable(String),
    `cause_source_concept_id` Nullable(Int64)
)
ORDER BY (`death_date`, `person_id`);

CREATE TABLE IF NOT EXISTS `drug_exposure` (
    `drug_exposure_id` Int64,
    `person_id` Int64,
    `drug_concept_id` Int64,
    `drug_exposure_start_date` Date32,
    `drug_exposure_start_datetime` Nullable(DateTime64),
    `drug_exposure_end_date` Date32,
    `drug_exposure_end_datetime` Nullable(DateTime64),
    `verbatim_end_date` Nullable(Date32),
    `drug_type_concept_id` Int64,
    `stop_reason` Nullable(String),
    `refills` Nullable(Int64),
    `quantity` Nullable(Float64),
    `days_supply` Nullable(Int64),
    `sig` Nullable(String),
    `route_concept_id` Nullable(Int64),
    `lot_number` Nullable(String),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `drug_source_value` LowCardinality(Nullable(String)),
    `drug_source_concept_id` Nullable(Int64),
    `route_source_value` LowCardinality(Nullable(String)),
    `dose_unit_source_value` LowCardinality(Nullable(String))
)
ORDER BY (`drug_exposure_start_date`, `drug_exposure_end_date`, `drug_exposure_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `measurement` (
    `measurement_id` Int64,
    `person_id` Int64,
    `measurement_concept_id` Int64,
    `measurement_date` Date32,
    `measurement_datetime` Nullable(DateTime64),
    `measurement_time` Nullable(String),
    `measurement_type_concept_id` Int64,
    `operator_concept_id` Nullable(Int64),
    `value_as_number` Nullable(Float64),
    `value_as_concept_id` Nullable(Int64),
    `unit_concept_id` Nullable(Int64),
    `range_low` Nullable(Float64),
    `range_high` Nullable(Float64),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `measurement_source_value` LowCardinality(Nullable(String)),
    `measurement_source_concept_id` Nullable(Int64),
    `unit_source_value` LowCardinality(Nullable(String)),
    `value_source_value` LowCardinality(Nullable(String)),
    `measurement_event_id` Nullable(Int64),
    `meas_event_field_concept_id` Nullable(Int64)
)
ORDER BY (`measurement_date`, `measurement_id`, `person_id`);


CREATE TABLE IF NOT EXISTS `observation` (
    `observation_id` Int64,
    `person_id` Int64,
    `observation_concept_id` Int64,
    `observation_date` Date32,
    `observation_datetime` Nullable(DateTime64),
    `observation_type_concept_id` Int64,
    `value_as_number` Nullable(Float64),
    `value_as_string` Nullable(String),
    `value_as_concept_id` Nullable(Int64),
    `qualifier_concept_id` Nullable(Int64),
    `unit_concept_id` Nullable(Int64),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `observation_source_value` LowCardinality(Nullable(String)),
    `observation_source_concept_id` Nullable(Int64),
    `unit_source_value` Nullable(String),
    `qualifier_source_value` Nullable(String),
    `value_source_value` Nullable(String),
    `observation_event_id` Nullable(Int64),
    `obs_event_field_concept_id` Nullable(Int64)
)
ORDER BY (`observation_date`, `observation_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `procedure_occurrence` (
    `procedure_occurrence_id` Int64,
    `person_id` Int64,
    `procedure_concept_id` Int64,
    `procedure_date` Date32,
    `procedure_datetime` Nullable(DateTime64),
    `procedure_end_date` Nullable(Date32),
    `procedure_end_datetime` Nullable(DateTime64),
    `procedure_type_concept_id` Int64,
    `modifier_concept_id` Nullable(Int64),
    `quantity` Nullable(Int64),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `procedure_source_value` LowCardinality(Nullable(String)),
    `procedure_source_concept_id` Nullable(Int64),
    `modifier_source_value` Nullable(String)
)
ORDER BY (`procedure_date`, `procedure_occurrence_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `person` (
    `person_id` Int64,
    `gender_concept_id` Int64,
    `year_of_birth` Int64,
    `month_of_birth` Nullable(Int64),
    `day_of_birth` Nullable(Int64),
    `birth_datetime` Nullable(DateTime64),
    `race_concept_id` Int64,
    `ethnicity_concept_id` Int64,
    `location_id` Nullable(Int64),
    `provider_id` Nullable(Int64),
    `care_site_id` Nullable(Int64),
    `person_source_value` Nullable(String),
    `gender_source_value` LowCardinality(Nullable(String)),
    `gender_source_concept_id` Nullable(Int64),
    `race_source_value` LowCardinality(Nullable(String)),
    `race_source_concept_id` Nullable(Int64),
    `ethnicity_source_value` LowCardinality(Nullable(String)),
    `ethnicity_source_concept_id` Nullable(Int64)
)
ORDER BY `person_id`;

CREATE TABLE IF NOT EXISTS `provider` (
    `provider_id` Int64,
    `provider_name` Nullable(String),
    `npi` Nullable(String),
    `dea` Nullable(String),
    `specialty_concept_id` Nullable(Int64),
    `care_site_id` Nullable(Int64),
    `year_of_birth` Nullable(Int64),
    `gender_concept_id` Nullable(Int64),
    `provider_source_value` Nullable(String),
    `specialty_source_value` Nullable(String),
    `specialty_source_concept_id` Nullable(Int64),
    `gender_source_value` Nullable(String),
    `gender_source_concept_id` Nullable(Int64)
)
ORDER BY `provider_id`;

CREATE TABLE IF NOT EXISTS `visit_occurrence` (
    `visit_occurrence_id` Int64,
    `person_id` Int64,
    `visit_concept_id` Int64,
    `visit_start_date` Date32,
    `visit_start_datetime` Nullable(DateTime64),
    `visit_end_date` Date32,
    `visit_end_datetime` Nullable(DateTime64),
    `visit_type_concept_id` Int64,
    `provider_id` Nullable(Int64),
    `care_site_id` Nullable(Int64),
    `visit_source_value` Nullable(String),
    `visit_source_concept_id` Nullable(Int64),
    `admitted_from_concept_id` Nullable(Int64),
    `admitted_from_source_value` Nullable(String),
    `discharged_to_concept_id` Nullable(Int64),
    `discharged_to_source_value` Nullable(String),
    `preceding_visit_occurrence_id` Nullable(Int64)
)
ORDER BY (`visit_start_date`, `visit_end_date`, `visit_occurrence_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `concept_ancestor` (
    `ancestor_concept_id` Int64,
    `descendant_concept_id` Int64,
    `min_levels_of_separation` Int64,
    `max_levels_of_separation` Int64
)
ORDER BY (`ancestor_concept_id`, `descendant_concept_id`);

CREATE TABLE IF NOT EXISTS `care_site` (
    `care_site_id` Int64,
    `care_site_name` Nullable(String),
    `place_of_service_concept_id` Nullable(Int64),
    `location_id` Nullable(Int64),
    `care_site_source_value` Nullable(String),
    `place_of_service_source_value` LowCardinality(Nullable(String))
)
ORDER BY `care_site_id`;

CREATE TABLE IF NOT EXISTS `device_exposure` (
    `device_exposure_id` Int64,
    `person_id` Int64,
    `device_concept_id` Int64,
    `device_exposure_start_date` Date32,
    `device_exposure_start_datetime` Nullable(DateTime64),
    `device_exposure_end_date` Nullable(Date32),
    `device_exposure_end_datetime` Nullable(DateTime64),
    `device_type_concept_id` Int64,
    `unique_device_id` Nullable(String),
    `production_id` Nullable(String),
    `quantity` Nullable(Int64),
    `provider_id` Nullable(Int64),
    `visit_occurrence_id` Nullable(Int64),
    `visit_detail_id` Nullable(Int64),
    `device_source_value` LowCardinality(Nullable(String)),
    `device_source_concept_id` Nullable(Int64),
    `unit_concept_id` Nullable(Int64),
    `unit_source_value` Nullable(String),
    `unit_source_concept_id` Nullable(Int64)
)
ORDER BY (`device_exposure_start_date`, `device_exposure_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `observation_period` (
    `observation_period_id` Int64,
    `person_id` Int64,
    `observation_period_start_date` Date32,
    `observation_period_end_date` Date32,
    `period_type_concept_id` Int64
)
ORDER BY (`observation_period_start_date`, `observation_period_end_date`, `observation_period_id`, `person_id`);

CREATE TABLE IF NOT EXISTS `location` (
    `location_id` Int64,
    `address_1` Nullable(String),
    `address_2` Nullable(String),
    `city` Nullable(String),
    `state` Nullable(String),
    `zip` Nullable(String),
    `county` Nullable(String),
    `location_source_value` Nullable(String),
    `country_concept_id` Nullable(Int64),
    `country_source_value` Nullable(String),
    `latitude` Nullable(Float64),
    `longitude` Nullable(Float64)
)
ORDER BY `location_id`;

CREATE TABLE IF NOT EXISTS `vocabulary` (
    `vocabulary_id` String,
    `vocabulary_name` String,
    `vocabulary_reference` Nullable(String),
    `vocabulary_version` Nullable(String),
    `vocabulary_concept_id` Int64
)
ORDER BY `vocabulary_id`;

CREATE TABLE IF NOT EXISTS `concept_synonym` (
    `concept_id` Int64,
    `concept_synonym_name` String,
    `language_concept_id` Int64
)
ORDER BY `concept_id`;

CREATE TABLE IF NOT EXISTS `relationship` (
    `relationship_id` String,
    `relationship_name` String,
    `is_hierarchical` LowCardinality(String),
    `defines_ancestry` LowCardinality(String),
    `reverse_relationship_id` String,
    `relationship_concept_id` Int64
)
ORDER BY `relationship_id`;

CREATE TABLE IF NOT EXISTS `concept_class` (
    `concept_class_id` String,
    `concept_class_name` String,
    `concept_class_concept_id` Int64
)
ORDER BY `concept_class_id`;

CREATE TABLE IF NOT EXISTS `drug_strength` (
    `drug_concept_id` Int64,
    `ingredient_concept_id` Int64,
    `amount_value` Nullable(Float64),
    `amount_unit_concept_id` Nullable(Int64),
    `numerator_value` Nullable(Float64),
    `numerator_unit_concept_id` Nullable(Int64),
    `denominator_value` Nullable(Float64),
    `denominator_unit_concept_id` Nullable(Int64),
    `box_size` Nullable(Int64),
    `valid_start_date` Date32,
    `valid_end_date` Date32,
    `invalid_reason` Nullable(String)
)
ORDER BY `drug_concept_id`;

CREATE TABLE IF NOT EXISTS `domain` (
    `domain_id` String,
    `domain_name` String,
    `domain_concept_id` Int64
)
ORDER BY `domain_id`;

CREATE TABLE `specimen` (
    `specimen_id` Int64,
    `person_id` Int64,
    `specimen_concept_id` Int64,
    `specimen_type_concept_id` Int64,
    `specimen_date` Date32,
    `specimen_datetime` Nullable(DateTime64),
    `quantity` Nullable(Float64),
    `unit_concept_id` Nullable(Int64),
    `anatomic_site_concept_id` Nullable(Int64),
    `disease_status_concept_id` Nullable(Int64),
    `specimen_source_id` Nullable(String),
    `specimen_source_value` Nullable(String),
    `unit_source_value` Nullable(String),
    `anatomic_site_source_value` Nullable(String),
    `disease_status_source_value` Nullable(String)
)
ORDER BY (`specimen_date`, `specimen_id`);

CREATE TABLE `cohort` (
    `cohort_id` UUID DEFAULT generateUUIDv7(),
    `name` String,
    `description` String,
    `cohort_definition` String,
    `author` UUID,
    `created_at` DateTime64 DEFAULT now(),
    `updated_at` DateTime64 DEFAULT now()
)
ORDER BY `cohort_id`;

CREATE TABLE `cohort_detail` (
    `cohort_id` UUID,
    `person_id` Int64
)
ORDER BY `cohort_id`;

CREATE TABLE `cohort_concept` (
    `cohort_id` UUID,
    `concept_id` Int64
) ORDER BY `cohort_id`;

CREATE TABLE IF NOT EXISTS feature_extraction
(
    cohort_id   UUID,                      
    type        LowCardinality(String),
    rank        Int64,                     
    concept_id  Int64,
    influence Int64,
    execution_time Float64
)
ORDER BY (cohort_id, type, rank);

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

