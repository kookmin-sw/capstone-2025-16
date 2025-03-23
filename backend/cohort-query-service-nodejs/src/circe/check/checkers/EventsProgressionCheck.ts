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

import { CohortExpression, ResultLimit } from '../../cohortdefinition/CohortExpression';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';

enum LimitType {
  NONE = 0,
  EARLIEST = 1,
  LATEST = 2,
  ALL = 3
}

export class EventsProgressionCheck extends BaseCheck {
  private static readonly WARNING = "%s limit may not have intended effect since it breaks all/latest/earliest progression";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    // First check the progression of event limits
    const initialWeight = this.getWeight(expression.PrimaryCriteria && expression.PrimaryCriteria.PrimaryCriteriaLimit);
    const cohortInitialWeight = this.getWeight(expression.QualifiedLimit);
    
    // qualifying limit is ignored when no additionalCriteria specified
    const qualifyingWeight = (expression.AdditionalCriteria) ? 
      this.getWeight(expression.ExpressionLimit) : this.getLimitTypeWeight(LimitType.NONE);
    
    if (initialWeight - cohortInitialWeight < 0) {
      reporter.add(EventsProgressionCheck.WARNING, "Cohort of initial events");
    }
    
    if (cohortInitialWeight - qualifyingWeight < 0 || initialWeight - qualifyingWeight < 0) {
      reporter.add(EventsProgressionCheck.WARNING, "Qualifying cohort");
    }
    
    // Also check for contradictory occurrence settings in inclusion rules
    if (expression.InclusionRules && expression.InclusionRules.length > 0) {
      for (const rule of expression.InclusionRules) {
        const criteriaList = rule.Expression?.CriteriaList || [];
        
        for (const criteria of criteriaList) {
          // Check for WindowedCriteria with Occurrence set to exactly 0
          if ('Window' in criteria && 'Criteria' in criteria) {
            const windowedCriteria = criteria as any; // Treat as WindowedCriteria
            
            if (windowedCriteria.Occurrence && 
                windowedCriteria.Occurrence.Type === 0 && // exactly
                windowedCriteria.Occurrence.Count === 0) { // zero occurrences
              
              reporter.add("Criteria in '%s' has an occurrence requirement of exactly 0, which may lead to 0 records", 
                rule.Name || "unnamed rule");
            }
          } 
          // Also check CorelatedCriteria
          else if (('StartWindow' in criteria || 'EndWindow' in criteria) && 'Criteria' in criteria) {
            const corelatedCriteria = criteria as any; // Treat as CorelatedCriteria
            
            if (corelatedCriteria.Occurrence && 
                corelatedCriteria.Occurrence.Type === 0 && // exactly
                corelatedCriteria.Occurrence.Count === 0) { // zero occurrences
              
              reporter.add("Criteria in '%s' has an occurrence requirement of exactly 0, which may lead to 0 records", 
                rule.Name || "unnamed rule");
            }
          }
        }
      }
    }
  }
  
  private getWeight(limit?: ResultLimit): number {
    return limit && limit.Type ? this.getLimitTypeWeightByName(limit.Type) : this.getLimitTypeWeight(LimitType.NONE);
  }
  
  private getLimitTypeWeight(type: LimitType): number {
    switch (type) {
      case LimitType.NONE:
        return 0;
      case LimitType.EARLIEST:
        return 0;
      case LimitType.LATEST:
        return 1;
      case LimitType.ALL:
        return 2;
      default:
        return 0;
    }
  }
  
  private getLimitTypeWeightByName(name: string | number): number {
    // Convert number to string if needed
    const typeName = typeof name === 'number' ? String(name) : name;
    
    switch (typeName) {
      case "null":
      case "0":
        return this.getLimitTypeWeight(LimitType.NONE);
      case "First":
      case "1":
        return this.getLimitTypeWeight(LimitType.EARLIEST);
      case "Last":
      case "2":
        return this.getLimitTypeWeight(LimitType.LATEST);
      case "All":
      case "3":
        return this.getLimitTypeWeight(LimitType.ALL);
      default:
        return this.getLimitTypeWeight(LimitType.NONE);
    }
  }
}