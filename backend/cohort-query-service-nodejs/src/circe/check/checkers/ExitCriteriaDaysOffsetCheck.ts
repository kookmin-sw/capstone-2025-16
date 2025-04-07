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

import { CohortExpression, DateOffsetStrategy } from '../../cohortdefinition/CohortExpression';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { Operations } from '../operations/Operations';

export class ExitCriteriaDaysOffsetCheck extends BaseCheck {
  private static readonly DAYS_OFFSET_WARNING = "Cohort Exit criteria: Days offset from start date should be greater than 0";

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    Operations.match<any, void>(expression.EndStrategy)
      .isA(DateOffsetStrategy)
      .then(s => Operations.match<DateOffsetStrategy, void>(s as DateOffsetStrategy)
        .when(dateOffsetStrategy => 
          dateOffsetStrategy.DateField === 'StartDate' && 
          dateOffsetStrategy.Offset === 0)
        .then(() => reporter.add(ExitCriteriaDaysOffsetCheck.DAYS_OFFSET_WARNING)));
  }
}