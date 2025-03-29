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

import { CohortExpression } from '../../cohortdefinition/CohortExpression';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { Operations } from '../operations/Operations';

export class InitialEventCheck extends BaseCheck {
  private static readonly NO_INITIAL_EVENT_ERROR = "No initial event criteria specified";

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    Operations.match<CohortExpression, void>(expression)
      .when(e => 
        !e.PrimaryCriteria?.CriteriaList || 
        e.PrimaryCriteria.CriteriaList.length === 0)
      .then(() => reporter.add(InitialEventCheck.NO_INITIAL_EVENT_ERROR));
  }
}