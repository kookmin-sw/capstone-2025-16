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

export abstract class BaseIterableCheck extends BaseCheck {
  protected beforeCheck(reporter: WarningReporter, expression: CohortExpression): void {
    // Default implementation does nothing, subclasses can override
  }

  protected afterCheck(reporter: WarningReporter, expression: CohortExpression): void {
    // Default implementation does nothing, subclasses can override
  }

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    this.beforeCheck(reporter, expression);
    this.internalCheck(expression, reporter);
    this.afterCheck(reporter, expression);
  }

  protected abstract internalCheck(expression: CohortExpression, reporter: WarningReporter): void;
}