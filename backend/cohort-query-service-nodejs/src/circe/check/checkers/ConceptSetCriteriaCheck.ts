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

import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCriteriaCheck } from './BaseCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { WarningReporterHelper } from './WarningReporterHelper';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
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
  ProcedureOccurrence, 
  Specimen, 
  VisitOccurrence,
  VisitDetail
} from '../../cohortdefinition/CohortExpression';

export class ConceptSetCriteriaCheck extends BaseCriteriaCheck {
  private static readonly NO_CONCEPT_SET_ERROR = "No concept set specified as part of a criteria at %s in %s criteria";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected checkCriteria(criteria: Criteria, groupName: string, reporter: WarningReporter): void {
    const helper = new WarningReporterHelper(reporter, ConceptSetCriteriaCheck.NO_CONCEPT_SET_ERROR, groupName);
    const criteriaName = CriteriaNameHelper.getCriteriaName(criteria);
    const addWarning = helper.addWarning(criteriaName);
    
    Operations.match<Criteria, void>(criteria)
      .isA(ConditionEra)
      .then(c => Operations.match<ConditionEra, void>(c as ConditionEra)
        .when(conditionEra => conditionEra.CodesetId === undefined || conditionEra.CodesetId === null)
        .then(addWarning))
      .isA(ConditionOccurrence)
      .then(c => Operations.match<ConditionOccurrence, void>(c as ConditionOccurrence)
        .when(conditionOccurrence => 
          (conditionOccurrence.CodesetId === undefined || conditionOccurrence.CodesetId === null) &&
          (conditionOccurrence.ConditionSourceConcept === undefined || conditionOccurrence.ConditionSourceConcept === null))
        .then(addWarning))
      .isA(Death)
      .then(c => Operations.match<Death, void>(c as Death)
        .when(death => death.CodesetId === undefined || death.CodesetId === null)
        .then(addWarning))
      .isA(DeviceExposure)
      .then(c => Operations.match<DeviceExposure, void>(c as DeviceExposure)
        .when(deviceExposure => 
          (deviceExposure.CodesetId === undefined || deviceExposure.CodesetId === null) &&
          (deviceExposure.DeviceSourceConcept === undefined || deviceExposure.DeviceSourceConcept === null))
        .then(addWarning))
      .isA(DoseEra)
      .then(c => Operations.match<DoseEra, void>(c as DoseEra)
        .when(doseEra => doseEra.CodesetId === undefined || doseEra.CodesetId === null)
        .then(addWarning))
      .isA(DrugEra)
      .then(c => Operations.match<DrugEra, void>(c as DrugEra)
        .when(drugEra => drugEra.CodesetId === undefined || drugEra.CodesetId === null)
        .then(addWarning))
      .isA(DrugExposure)
      .then(c => Operations.match<DrugExposure, void>(c as DrugExposure)
        .when(drugExposure => 
          (drugExposure.CodesetId === undefined || drugExposure.CodesetId === null) &&
          (drugExposure.DrugSourceConcept === undefined || drugExposure.DrugSourceConcept === null))
        .then(addWarning))
      .isA(Measurement)
      .then(c => Operations.match<Measurement, void>(c as Measurement)
        .when(measurement => 
          (measurement.CodesetId === undefined || measurement.CodesetId === null) &&
          (measurement.MeasurementSourceConcept === undefined || measurement.MeasurementSourceConcept === null))
        .then(addWarning))
      .isA(Observation)
      .then(c => Operations.match<Observation, void>(c as Observation)
        .when(observation => 
          (observation.CodesetId === undefined || observation.CodesetId === null) &&
          (observation.ObservationSourceConcept === undefined || observation.ObservationSourceConcept === null))
        .then(addWarning))
      .isA(ProcedureOccurrence)
      .then(c => Operations.match<ProcedureOccurrence, void>(c as ProcedureOccurrence)
        .when(procedureOccurrence => 
          (procedureOccurrence.CodesetId === undefined || procedureOccurrence.CodesetId === null) &&
          (procedureOccurrence.ProcedureSourceConcept === undefined || procedureOccurrence.ProcedureSourceConcept === null))
        .then(addWarning))
      .isA(Specimen)
      .then(c => Operations.match<Specimen, void>(c as Specimen)
        .when(specimen => 
          (specimen.CodesetId === undefined || specimen.CodesetId === null) &&
          (specimen.SpecimenSourceConcept === undefined || specimen.SpecimenSourceConcept === null))
        .then(addWarning))
      .isA(VisitOccurrence)
      .then(c => Operations.match<VisitOccurrence, void>(c as VisitOccurrence)
        .when(visitOccurrence => 
          (visitOccurrence.CodesetId === undefined || visitOccurrence.CodesetId === null) &&
          (visitOccurrence.VisitSourceConcept === undefined || visitOccurrence.VisitSourceConcept === null))
        .then(addWarning))
      .isA(VisitDetail)
      .then(c => Operations.match<VisitDetail, void>(c as VisitDetail)
        .when(visitDetail => 
          (visitDetail.CodesetId === undefined || visitDetail.CodesetId === null) &&
          (visitDetail.VisitDetailSourceConcept === undefined || visitDetail.VisitDetailSourceConcept === null))
        .then(addWarning));
  }
}