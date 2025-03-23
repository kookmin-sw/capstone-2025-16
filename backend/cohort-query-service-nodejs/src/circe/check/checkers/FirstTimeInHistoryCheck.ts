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

import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { Operations } from '../operations/Operations';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { 
  CorelatedCriteria,
  Criteria,
  ConditionEra,
  ConditionOccurrence,
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

export class FirstTimeInHistoryCheck extends BaseCorelatedCriteriaCheck {
  private static readonly WARNING = "%s didn't specify that it must be first time in patient's history";

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }

  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    const name = `${CriteriaNameHelper.getCriteriaName(criteria.Criteria)} at ${groupName}`;
    const addWarning = () => reporter.add(FirstTimeInHistoryCheck.WARNING, name);

    Operations.match<CorelatedCriteria, void>(criteria)
      .when(c => c.StartWindow !== undefined && 
             ((c.StartWindow.Start !== undefined && c.StartWindow.Start.Days !== undefined) || 
              (c.StartWindow.End !== undefined && c.StartWindow.End.Days !== undefined)))
      .then(cc => {
        const c = cc.Criteria;
        
        if (c instanceof ConditionEra) {
          Operations.match<ConditionEra, void>(c)
            .when(conditionEra => conditionEra.First === undefined || conditionEra.First === null)
            .then(addWarning);
        } else if (c instanceof ConditionOccurrence) {
          Operations.match<ConditionOccurrence, void>(c)
            .when(conditionOccurrence => conditionOccurrence.First === undefined || conditionOccurrence.First === null)
            .then(addWarning);
        } else if (c instanceof DeviceExposure) {
          Operations.match<DeviceExposure, void>(c)
            .when(deviceExposure => deviceExposure.First === undefined || deviceExposure.First === null)
            .then(addWarning);
        } else if (c instanceof DoseEra) {
          Operations.match<DoseEra, void>(c)
            .when(doseEra => doseEra.First === undefined || doseEra.First === null)
            .then(addWarning);
        } else if (c instanceof DrugEra) {
          Operations.match<DrugEra, void>(c)
            .when(drugEra => drugEra.First === undefined || drugEra.First === null)
            .then(addWarning);
        } else if (c instanceof DrugExposure) {
          Operations.match<DrugExposure, void>(c)
            .when(drugExposure => drugExposure.First === undefined || drugExposure.First === null)
            .then(addWarning);
        } else if (c instanceof Measurement) {
          Operations.match<Measurement, void>(c)
            .when(measurement => measurement.First === undefined || measurement.First === null)
            .then(addWarning);
        } else if (c instanceof Observation) {
          Operations.match<Observation, void>(c)
            .when(observation => observation.First === undefined || observation.First === null)
            .then(addWarning);
        } else if (c instanceof ObservationPeriod) {
          Operations.match<ObservationPeriod, void>(c)
            .when(observationPeriod => observationPeriod.First === undefined || observationPeriod.First === null)
            .then(addWarning);
        } else if (c instanceof ProcedureOccurrence) {
          Operations.match<ProcedureOccurrence, void>(c)
            .when(procedureOccurrence => procedureOccurrence.First === undefined || procedureOccurrence.First === null)
            .then(addWarning);
        } else if (c instanceof Specimen) {
          Operations.match<Specimen, void>(c)
            .when(specimen => specimen.First === undefined || specimen.First === null)
            .then(addWarning);
        } else if (c instanceof VisitOccurrence) {
          Operations.match<VisitOccurrence, void>(c)
            .when(visitOccurrence => visitOccurrence.First === undefined || visitOccurrence.First === null)
            .then(addWarning);
        } else if (c instanceof VisitDetail) {
          Operations.match<VisitDetail, void>(c)
            .when(visitDetail => visitDetail.First === undefined || visitDetail.First === null)
            .then(addWarning);
        } else if (c instanceof PayerPlanPeriod) {
          Operations.match<PayerPlanPeriod, void>(c)
            .when(payerPlanPeriod => payerPlanPeriod.First === undefined || payerPlanPeriod.First === null)
            .then(addWarning);
        }
      });
  }
}