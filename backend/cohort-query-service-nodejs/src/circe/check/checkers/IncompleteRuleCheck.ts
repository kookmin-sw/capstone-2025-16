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

import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { CohortExpression, InclusionRule } from '../../cohortdefinition/CohortExpression';
import { Warning } from '../warnings/Warning';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { IncompleteRuleWarning } from '../warnings/IncompleteRuleWarning';

export class IncompleteRuleCheck extends BaseCheck {
  
  protected getReporter(severity: WarningSeverity, warnings: Warning[]): WarningReporter {
    return {
      add: (name: string) => {
        warnings.push(new IncompleteRuleWarning(this.defineSeverity(), name));
      }
    };
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    if (expression.InclusionRules) {
      expression.InclusionRules.forEach(rule => this.checkInclusionRule(rule, reporter));
    }
  }
  
  private checkInclusionRule(rule: InclusionRule, reporter: WarningReporter): void {
    if (this.isExpressionEmpty(rule)) {
      reporter.add(rule.Name);
    }
  }
  
  private isExpressionEmpty(rule: InclusionRule): boolean {
    // Check if criteria lists and demographic lists are empty or undefined
    return !rule.Expression || 
      (!rule.Expression.CriteriaList || rule.Expression.CriteriaList.length === 0) && 
      (!rule.Expression.DemographicCriteriaList || rule.Expression.DemographicCriteriaList.length === 0) &&
      (!rule.Expression.Groups || rule.Expression.Groups.length === 0);
  }
}