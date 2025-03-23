/*
 *   Copyright 2017 Observational Health Data Sciences and Informatics
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 *   Authors: Vitaly Koulakov, Sergey Suvorov
 *
 */

export namespace Constants {
  export namespace Criteria {
    export const CONDITION_ERA = "condition era";
    export const CONDITION_OCCURRENCE = "condition occurrence";
    export const DEATH = "death";
    export const DEVICE_EXPOSURE = "device exposure";
    export const DOSE_ERA = "dose era";
    export const DRUG_ERA = "drug era";
    export const DRUG_EXPOSURE = "drug exposure";
    export const MEASUREMENT = "measurement";
    export const OBSERVATION = "observation";
    export const PROCEDURE_OCCURRENCE = "procedure occurrence";
    export const SPECIMEN = "specimen";
    export const VISIT_OCCURRENCE = "visit occurrence";
    export const VISIT_DETAIL = "visit detail";
    export const PAYER_PLAN_PERIOD = "payer plan period";
    export const OBSERVATION_PERIOD = "observation period";
    export const LOCATION_REGION = "location region";
    export const DEMOGRAPHIC = "demographic";
  }

  export namespace Attributes {
    export const AGE_ATTR = "age";
    export const QUANTITY_ATTR = "quantity";
    export const OCCURRENCE_START_DATE_ATTR = "occurrence start date";
    export const OCCURRENCE_END_DATE_ATTR = "occurrence end date";
    export const ERA_START_DATE_ATTR = "era start date";
    export const ERA_END_DATE_ATTR = "era end date";
    export const DOSE_VALUE_ATTR = "dose value";
    export const ERA_LENGTH_ATTR = "era length";
    export const AGE_AT_START_ATTR = "age at start";
    export const AGE_AT_END_ATTR = "age at end";
    export const OCCURRENCE_COUNT_ATTR = "occurrence count";
    export const GAP_DAYS_ATTR = "gap days";
    export const AGE_AT_ERA_START_ATTR = "age at era start";
    export const AGE_AT_ERA_END_ATTR = "age at era end";
    export const REFILLS_ATTR = "refills";
    export const DAYS_SUPPLY_ATTR = "days supply";
    export const EFFECTIVE_DRUG_DOSE_ATTR = "effective drug dose";
    export const VALUE_AS_NUMBER_ATTR = "value as number";
    export const RANGE_LOW_ATTR = "range low";
    export const RANGE_HIGH_ATTR = "range high";
    export const RANGE_LOW_RATIO_ATTR = "range low ratio";
    export const RANGE_HIGH_RATIO_ATTR = "range high ratio";
    export const PERIOD_START_DATE_ATTR = "period start date";
    export const PERIOD_END_DATE_ATTR = "period end date";
    export const PERIOD_LENGTH_ATTR = "period length";
    export const USER_DEFINED_PERIOD_ATTR = "user defined period";
    export const VISIT_LENGTH_ATTR = "visit length";
    export const CENSOR_WINDOW_ATTR = "censor window";
    export const GENDER_ATTR = "gender";
    export const RACE_ATTR = "race";
    export const ETHNICITY_ATTR = "ethnicity";
    export const VISIT_TYPE_ATTR = "visit";
    export const PROVIDER_SPECIALITY_ATTR = "provider speciality";
    export const CONDITION_TYPE_ATTR = "condition type";
    export const DEATH_TYPE_ATTR = "death type";
    export const DEVICE_TYPE_ATTR = "device type";
    export const UNIT_ATTR = "unit";
    export const DRUG_TYPE_ATTR = "drug type";
    export const ROUTE_CONCEPT_ATTR = "route concept";
    export const DOSE_UNIT_ATTR = "dose unit";
    export const MEASUREMENT_TYPE_ATTR = "measurement type";
    export const OPERATOR_ATTR = "operator";
    export const VALUE_AS_CONCEPT_ATTR = "value as concept";
    export const OBSERVATION_TYPE_ATTR = "observation type";
    export const QUALIFIER_ATTR = "qualifier";
    export const PERIOD_TYPE_ATTR = "period type";
    export const PROCEDURE_TYPE_ATTR = "procedure type";
    export const MODIFIER_ATTR = "modifier";
    export const SPECIMEN_TYPE_ATTR = "specimen type";
    export const ANATOMIC_SITE_ATTR = "anatomic site";
    export const DISEASE_STATUS_ATTR = "disease status";
    export const PLACE_OF_SERVICE_ATTR = "place of service";
    export const ADMITTED_FROM_ATTR = "admitted from";
    export const DISCHARGED_TO_ATTR = "discharged to";
    export const LOCATION_REGION_START_DATE_ATTR = "location region start date";
    export const LOCATION_REGION_END_DATE_ATTR = "location region end date";
    export const STOP_REASON_ATTR = "stop reason";
    export const UNIQUE_DEVICE_ID_ATTR = "unique device id";
    export const LOT_NUMBER_ATTR = "lot number";
    export const VALUE_AS_STRING_ATTR = "value as string";
    export const SOURCE_ID_ATTR = "source id";
    export const VISIT_DETAIL_START_DATE_ATTR = "visit detail start date";
    export const VISIT_DETAIL_END_DATE_ATTR = "visit detail end date";
    export const VISIT_DETAIL_LENGTH_ATTR = "visit detail length";
    export const VISIT_DETAIL_TYPE_ATTR = "visit detail type";
  }
}