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
import { Operations } from '../operations/Operations';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';

export class NoExitCriteriaCheck extends BaseCheck {
  private static readonly NO_EXIT_CRITERIA_WARNING = " \"all events\" are selected and cohort exit criteria has not been specified";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    if (!expression || !expression.PrimaryCriteria) {
      return; // Early exit if expression or PrimaryCriteria are missing
    }
    
    // Check primary limit
    const primaryLimit = expression.PrimaryCriteria.PrimaryCriteriaLimit;
    if (!primaryLimit || !primaryLimit.Type) {
      return; // Exit if no primary limit or type
    }
    
    // Use a more direct approach to avoid type errors
    // Check if type is a string and equals "all" (case-insensitive)
    const primaryLimitType = primaryLimit.Type;
    if (typeof primaryLimitType === 'string') {
      // Safe assertion since we've already checked the type
      if ((primaryLimitType as string).toLowerCase() !== "all") {
        return;
      }
    } else if (primaryLimitType !== 3) { // Check if it's the numeric equivalent (3)
      return;
    }
    
    // Check end strategy
    if (expression.EndStrategy) {
      return; // Exit if end strategy exists
    }
    
    // Check expression limit
    const expressionLimit = expression.ExpressionLimit;
    if (!expressionLimit || !expressionLimit.Type) {
      return; // Exit if no expression limit or type
    }
    
    // Use a more direct approach to avoid type errors
    // Check if type is a string and equals "all" (case-insensitive)
    const expressionLimitType = expressionLimit.Type;
    if (typeof expressionLimitType === 'string') {
      // Safe assertion since we've already checked the type
      if ((expressionLimitType as string).toLowerCase() !== "all") {
        return;
      }
    } else if (expressionLimitType !== 3) { // Check if it's the numeric equivalent (3)
      return;
    }
    
    // Check additional criteria
    if (expression.AdditionalCriteria) {
      // If additional criteria exists, also check qualified limit
      const qualifiedLimit = expression.QualifiedLimit;
      if (!qualifiedLimit || !qualifiedLimit.Type) {
        return; // Exit if no qualified limit or type
      }
      
      // Use a more direct approach to avoid type errors
      // Check if type is a string and equals "all" (case-insensitive)
      const qualifiedLimitType = qualifiedLimit.Type;
      if (typeof qualifiedLimitType === 'string') {
        // Safe assertion since we've already checked the type
        if ((qualifiedLimitType as string).toLowerCase() !== "all") {
          return;
        }
      } else if (qualifiedLimitType !== 3) { // Check if it's the numeric equivalent (3)
        return;
      }
    }
    
    // If we get here, all conditions are met to show the warning
    reporter.add(NoExitCriteriaCheck.NO_EXIT_CRITERIA_WARNING);
  }
}