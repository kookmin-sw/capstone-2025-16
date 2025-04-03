import { Kysely, PostgresDialect } from "kysely";
import { ClickhouseDialect } from "@founderpath/kysely-clickhouse";

export interface Database {
  codesets: Codesets; // temp table
  temp_cohort: Cohort; // temp table

  cohort: Cohort;

  condition_era: ConditionEra;
  drug_era: DrugEra;
  dose_era: DoseEra;
  concept: Concept;
  concept_relationship: ConceptRelationship;
  condition_occurrence: ConditionOccurrence;
  death: Death;
  drug_exposure: DrugExposure;
  measurement: Measurement;
  observation: Observation;
  procedure_occurrence: ProcedureOccurrence;
  person: Person;
  provider: Provider;
  visit_occurrence: VisitOccurrence;
  concept_ancestor: ConceptAncestor;
  care_site: CareSite;
  device_exposure: DeviceExposure;
  observation_period: ObservationPeriod;
  location: Location;
  vocabulary: Vocabulary;
  concept_synonym: ConceptSynonym;
  relationship: Relationship;
  concept_class: ConceptClass;
  drug_strength: DrugStrength;
  domain: Domain;
  specimen: Specimen;
}

export const db = new Kysely<Database>({
  dialect: new ClickhouseDialect(),
  // dialect: new PostgresDialect(undefined as any),
});

// id should be string (bigint)

export interface Codesets {
  codeset_id: string;
  concept_id: string;
}

export interface Cohort {
  cohort_id: string;
  person_id: string;
  start_date: string;
  end_date: string;
}

export interface ConditionEra {
  condition_era_id: string;
  person_id: string;
  condition_concept_id: string;
  condition_era_start_date: string;
  condition_era_end_date: string;
  condition_occurrence_count?: number;
}

export interface DrugEra {
  drug_era_id: string;
  person_id: string;
  drug_concept_id: string;
  drug_era_start_date: string;
  drug_era_end_date: string;
  drug_exposure_count?: number;
  gap_days?: number;
}

export interface DoseEra {
  dose_era_id: string;
  person_id: string;
  drug_concept_id: string;
  unit_concept_id: string;
  dose_value: number;
  dose_era_start_date: string;
  dose_era_end_date: string;
}

export interface Concept {
  concept_id: string;
  concept_name: string;
  domain_id: string;
  vocabulary_id: string;
  concept_class_id: string;
  standard_concept?: string;
  concept_code: string;
  valid_start_date: string;
  valid_end_date: string;
  invalid_reason?: string;
}

export interface ConceptRelationship {
  concept_id_1: string;
  concept_id_2: string;
  relationship_id: string;
  valid_start_date: string;
  valid_end_date: string;
  invalid_reason?: string;
}

export interface ConditionOccurrence {
  condition_occurrence_id: string;
  person_id: string;
  condition_concept_id: string;
  condition_start_date: string;
  condition_start_datetime?: string;
  condition_end_date: string;
  condition_end_datetime?: string;
  condition_type_concept_id: string;
  condition_status_concept_id?: string;
  stop_reason?: string;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  condition_source_value?: string;
  condition_source_concept_id?: string;
  condition_status_source_value?: string;
}

export interface Death {
  person_id: string;
  death_date: string;
  death_datetime?: string;
  death_type_concept_id?: string;
  cause_concept_id?: string;
  cause_source_value?: string;
  cause_source_concept_id?: string;
}

export interface DrugExposure {
  drug_exposure_id: string;
  person_id: string;
  drug_concept_id: string;
  drug_exposure_start_date: string;
  drug_exposure_start_datetime?: string;
  drug_exposure_end_date: string;
  drug_exposure_end_datetime?: string;
  verbatim_end_date?: string;
  drug_type_concept_id: string;
  stop_reason?: string;
  refills?: number;
  quantity?: number;
  days_supply?: number;
  sig?: string;
  route_concept_id?: string;
  lot_number?: string;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  drug_source_value?: string;
  drug_source_concept_id?: string;
  route_source_value?: string;
  dose_unit_source_value?: string;
}

export interface Measurement {
  measurement_id: string;
  person_id: string;
  measurement_concept_id: string;
  measurement_date: string;
  measurement_datetime?: string;
  measurement_time?: string;
  measurement_type_concept_id: string;
  operator_concept_id?: string;
  value_as_number?: number;
  value_as_concept_id?: string;
  unit_concept_id?: string;
  range_low?: number;
  range_high?: number;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  measurement_source_value?: string;
  measurement_source_concept_id?: string;
  unit_source_value?: string;
  value_source_value?: string;
  measurement_event_id?: string;
  meas_event_field_concept_id?: string;
}

export interface Observation {
  observation_id: string;
  person_id: string;
  observation_concept_id: string;
  observation_date: string;
  observation_datetime?: string;
  observation_type_concept_id: string;
  value_as_number?: number;
  value_as_string?: string;
  value_as_concept_id?: string;
  qualifier_concept_id?: string;
  unit_concept_id?: string;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  observation_source_value?: string;
  observation_source_concept_id?: string;
  unit_source_value?: string;
  qualifier_source_value?: string;
  value_source_value?: string;
  observation_event_id?: string;
  obs_event_field_concept_id?: string;
}

export interface ProcedureOccurrence {
  procedure_occurrence_id: string;
  person_id: string;
  procedure_concept_id: string;
  procedure_date: string;
  procedure_datetime?: string;
  procedure_end_date?: string;
  procedure_end_datetime?: string;
  procedure_type_concept_id: string;
  modifier_concept_id?: string;
  quantity?: number;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  procedure_source_value?: string;
  procedure_source_concept_id?: string;
  modifier_source_value?: string;
}

export interface Person {
  person_id: string;
  gender_concept_id: string;
  year_of_birth: number;
  month_of_birth?: number;
  day_of_birth?: number;
  birth_datetime?: string;
  race_concept_id: string;
  ethnicity_concept_id: string;
  location_id?: string;
  provider_id?: string;
  care_site_id?: string;
  person_source_value?: string;
  gender_source_value?: string;
  gender_source_concept_id?: string;
  race_source_value?: string;
  race_source_concept_id?: string;
  ethnicity_source_value?: string;
  ethnicity_source_concept_id?: string;
}

export interface Provider {
  provider_id: string;
  provider_name?: string;
  npi?: string;
  dea?: string;
  specialty_concept_id?: string;
  care_site_id?: string;
  year_of_birth?: number;
  gender_concept_id?: string;
  provider_source_value?: string;
  specialty_source_value?: string;
  specialty_source_concept_id?: string;
  gender_source_value?: string;
  gender_source_concept_id?: string;
}

export interface VisitOccurrence {
  visit_occurrence_id: string;
  person_id: string;
  visit_concept_id: string;
  visit_start_date: string;
  visit_start_datetime?: string;
  visit_end_date: string;
  visit_end_datetime?: string;
  visit_type_concept_id: string;
  provider_id?: string;
  care_site_id?: string;
  visit_source_value?: string;
  visit_source_concept_id?: string;
  admitted_from_concept_id?: string;
  admitted_from_source_value?: string;
  discharged_to_concept_id?: string;
  discharged_to_source_value?: string;
  preceding_visit_occurrence_id?: string;
}

export interface ConceptAncestor {
  ancestor_concept_id: string;
  descendant_concept_id: string;
  min_levels_of_separation: number;
  max_levels_of_separation: number;
}

export interface CareSite {
  care_site_id: string;
  care_site_name?: string;
  place_of_service_concept_id?: string;
  location_id?: string;
  care_site_source_value?: string;
  place_of_service_source_value?: string;
}

export interface DeviceExposure {
  device_exposure_id: string;
  person_id: string;
  device_concept_id: string;
  device_exposure_start_date: string;
  device_exposure_start_datetime?: string;
  device_exposure_end_date?: string;
  device_exposure_end_datetime?: string;
  device_type_concept_id: string;
  unique_device_id?: string;
  production_id?: string;
  quantity?: number;
  provider_id?: string;
  visit_occurrence_id?: string;
  visit_detail_id?: string;
  device_source_value?: string;
  device_source_concept_id?: string;
  unit_concept_id?: string;
  unit_source_value?: string;
  unit_source_concept_id?: string;
}

export interface ObservationPeriod {
  observation_period_id: string;
  person_id: string;
  observation_period_start_date: string;
  observation_period_end_date: string;
  period_type_concept_id: string;
}

export interface Location {
  location_id: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  location_source_value?: string;
  country_concept_id?: string;
  country_source_value?: string;
  latitude?: number;
  longitude?: number;
}

export interface Vocabulary {
  vocabulary_id: string;
  vocabulary_name: string;
  vocabulary_reference?: string;
  vocabulary_version?: string;
  vocabulary_concept_id: string;
}

export interface ConceptSynonym {
  concept_id: string;
  concept_synonym_name: string;
  language_concept_id: string;
}

export interface Relationship {
  relationship_id: string;
  relationship_name: string;
  is_hierarchical: string;
  defines_ancestry: string;
  reverse_relationship_id: string;
  relationship_concept_id: string;
}

export interface ConceptClass {
  concept_class_id: string;
  concept_class_name: string;
  concept_class_concept_id: string;
}

export interface DrugStrength {
  drug_concept_id: string;
  ingredient_concept_id: string;
  amount_value?: number;
  amount_unit_concept_id?: string;
  numerator_value?: number;
  numerator_unit_concept_id?: string;
  denominator_value?: number;
  denominator_unit_concept_id?: string;
  box_size?: number;
  valid_start_date: string;
  valid_end_date: string;
  invalid_reason?: string;
}

export interface Domain {
  domain_id: string;
  domain_name: string;
  domain_concept_id: string;
}

export interface Specimen {
  specimen_id: string;
  person_id: string;
  specimen_concept_id: string;
  specimen_type_concept_id: string;
  specimen_date: string;
  specimen_datetime?: string;
  quantity?: number;
  unit_concept_id?: string;
  anatomic_site_concept_id?: string;
  disease_status_concept_id?: string;
  specimen_source_id?: string;
  specimen_source_value?: string;
  unit_source_value?: string;
  anatomic_site_source_value?: string;
  disease_status_source_value?: string;
}
