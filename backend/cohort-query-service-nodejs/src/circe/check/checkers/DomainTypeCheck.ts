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

import { 
  CohortExpression, 
  Criteria, 
  ConditionOccurrence, 
  Death, 
  DeviceExposure, 
  DrugExposure, 
  Measurement, 
  Observation, 
  ProcedureOccurrence, 
  Specimen, 
  VisitOccurrence,
  VisitDetail
} from '../../cohortdefinition/CohortExpression';
import { Operations } from '../operations/Operations';
import { Execution } from '../operations/Execution';
import { BaseCriteriaCheck } from './BaseCriteriaCheck';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { WarningReporter } from './WarningReporter';

export class DomainTypeCheck extends BaseCriteriaCheck {
  private static readonly WARNING = "It's not specified what type of records to look for in %s";
  private warnNames: string[] = [];

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }

  protected checkCriteria(criteria: Criteria, groupName: string, reporter: WarningReporter): void {
    const name = CriteriaNameHelper.getCriteriaName(criteria);
    const addWarning = (): void => { this.warnNames.push(name + " at " + groupName); };
    
    Operations.match<Criteria, void>(criteria)
      .isA(ConditionOccurrence)
      .then(c => Operations.match<ConditionOccurrence, void>(c as ConditionOccurrence)
        .when(conditionOccurrence => conditionOccurrence.ConditionType === undefined || conditionOccurrence.ConditionType === null)
        .then(addWarning))
      .isA(Death)
      .then(c => Operations.match<Death, void>(c as Death)
        .when(death => death.DeathType === undefined || death.DeathType === null)
        .then(addWarning))
      .isA(DeviceExposure)
      .then(c => Operations.match<DeviceExposure, void>(c as DeviceExposure)
        .when(deviceExposure => deviceExposure.DeviceType === undefined || deviceExposure.DeviceType === null)
        .then(addWarning))
      .isA(DrugExposure)
      .then(c => Operations.match<DrugExposure, void>(c as DrugExposure)
        .when(drugExposure => drugExposure.DrugType === undefined || drugExposure.DrugType === null)
        .then(addWarning))
      .isA(Measurement)
      .then(c => Operations.match<Measurement, void>(c as Measurement)
        .when(measurement => measurement.MeasurementType === undefined || measurement.MeasurementType === null)
        .then(addWarning))
      .isA(Observation)
      .then(c => Operations.match<Observation, void>(c as Observation)
        .when(observation => observation.ObservationType === undefined || observation.ObservationType === null)
        .then(addWarning))
      .isA(ProcedureOccurrence)
      .then(c => Operations.match<ProcedureOccurrence, void>(c as ProcedureOccurrence)
        .when(procedureOccurrence => procedureOccurrence.ProcedureType === undefined || procedureOccurrence.ProcedureType === null)
        .then(addWarning))
      .isA(Specimen)
      .then(c => Operations.match<Specimen, void>(c as Specimen)
        .when(specimen => specimen.SpecimenType === undefined || specimen.SpecimenType === null)
        .then(addWarning))
      .isA(VisitOccurrence)
      .then(c => Operations.match<VisitOccurrence, void>(c as VisitOccurrence)
        .when(visitOccurrence => visitOccurrence.VisitType === undefined || visitOccurrence.VisitType === null)
        .then(addWarning))
      .isA(VisitDetail)
      .then(c => Operations.match<VisitDetail, void>(c as VisitDetail)
        .when(visitDetail => visitDetail.VisitType === undefined || visitDetail.VisitType === null)
        .then(addWarning));
  }

  protected afterCheck(reporter: WarningReporter, expression: CohortExpression): void {
    if (this.warnNames.length > 0) {
      reporter.add(DomainTypeCheck.WARNING, this.warnNames.join(", "));
    }
  }
}