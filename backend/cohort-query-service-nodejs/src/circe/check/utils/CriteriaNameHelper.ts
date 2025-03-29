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
 *   Authors: Vitaly Koulakov
 *
 */

import { Constants } from '../Constants';
import { Operations } from '../operations/Operations';
import { 
  Criteria, 
  ConditionEra, 
  ConditionOccurrence, 
  Death, 
  DeviceExposure, 
  DoseEra, 
  DrugEra, 
  DrugExposure, 
  Measurement, 
  Observation, 
  ObservationPeriod, 
  ProcedureOccurrence, 
  Specimen, 
  VisitOccurrence,
  VisitDetail,
  PayerPlanPeriod
} from '../../cohortdefinition/CohortExpression';

export class CriteriaNameHelper {
  public static getCriteriaName(criteria: Criteria): string {
    return Operations.match<Criteria, string>(criteria)
      .isA(ConditionEra).thenReturn(c => Constants.Criteria.CONDITION_ERA)
      .isA(ConditionOccurrence).thenReturn(c => Constants.Criteria.CONDITION_OCCURRENCE)
      .isA(Death).thenReturn(c => Constants.Criteria.DEATH)
      .isA(DeviceExposure).thenReturn(c => Constants.Criteria.DEVICE_EXPOSURE)
      .isA(DoseEra).thenReturn(c => Constants.Criteria.DOSE_ERA)
      .isA(DrugEra).thenReturn(c => Constants.Criteria.DRUG_ERA)
      .isA(DrugExposure).thenReturn(c => Constants.Criteria.DRUG_EXPOSURE)
      .isA(Measurement).thenReturn(c => Constants.Criteria.MEASUREMENT)
      .isA(Observation).thenReturn(c => Constants.Criteria.OBSERVATION)
      .isA(ObservationPeriod).thenReturn(c => Constants.Criteria.OBSERVATION_PERIOD)
      .isA(ProcedureOccurrence).thenReturn(c => Constants.Criteria.PROCEDURE_OCCURRENCE)
      .isA(Specimen).thenReturn(c => Constants.Criteria.SPECIMEN)
      .isA(VisitOccurrence).thenReturn(c => Constants.Criteria.VISIT_OCCURRENCE)
      .isA(VisitDetail).thenReturn(c => Constants.Criteria.VISIT_DETAIL)
      .isA(PayerPlanPeriod).thenReturn(c => Constants.Criteria.PAYER_PLAN_PERIOD)
      .value();
  }
}