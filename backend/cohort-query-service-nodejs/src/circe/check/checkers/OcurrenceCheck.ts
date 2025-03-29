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

import { CorelatedCriteria } from '../../cohortdefinition/CohortExpression';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { Operations } from '../operations/Operations';

export class OcurrenceCheck extends BaseCorelatedCriteriaCheck {
  private static readonly AT_LEAST_0_WARNING = "'at least 0' occurrence is not a real constraint, probably meant 'exactly 0' or 'at least 1'";
  private static readonly AT_LEAST = 2;

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }

  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    Operations.match<CorelatedCriteria, void>(criteria)
      .when(c => 
        c.Occurrence?.Type === OcurrenceCheck.AT_LEAST && 
        c.Occurrence?.Count === 0)
      .then(() => reporter.add(OcurrenceCheck.AT_LEAST_0_WARNING));
  }
}