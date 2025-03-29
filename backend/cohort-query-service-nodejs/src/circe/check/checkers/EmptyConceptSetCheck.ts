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
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';

export class EmptyConceptSetCheck extends BaseCheck {
  private static readonly EMPTY_ERROR = "Concept set %s contains no concepts";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.CRITICAL;
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    (expression.ConceptSets || [])
      .filter(conceptSet => 
        !conceptSet.Expression || 
        !conceptSet.Expression.Items || 
        conceptSet.Expression.Items.length === 0)
      .forEach(conceptSet => 
        reporter.add(EmptyConceptSetCheck.EMPTY_ERROR, conceptSet.Name));
  }
}