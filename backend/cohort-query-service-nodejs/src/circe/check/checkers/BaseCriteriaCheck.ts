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

import { CohortExpression, Criteria, CorelatedCriteria, WindowedCriteria } from '../../cohortdefinition/CohortExpression';
import { ICriteria, ICorelatedCriteria } from '../../cohortdefinition/CriteriaInterfaces';
import { BaseIterableCheck } from './BaseIterableCheck';
import { WarningReporter } from './WarningReporter';

export abstract class BaseCriteriaCheck extends BaseIterableCheck {
  // Make static constants available as instance properties for compatibility
  protected INITIAL_EVENT = BaseCriteriaCheck.INITIAL_EVENT;
  protected INCLUSION_RULE = BaseCriteriaCheck.INCLUSION_RULE;
  
  protected internalCheck(expression: CohortExpression, reporter: WarningReporter): void {
    if (expression.PrimaryCriteria) {
      // Check primary criteria
      (expression.PrimaryCriteria.CriteriaList || []).forEach(criteria => 
        this.checkCriteriaGroup(criteria, BaseCriteriaCheck.INITIAL_EVENT, reporter));
    
      // Check inclusion rules
      (expression.InclusionRules || []).forEach(inclusionRule => {
        if (inclusionRule.Expression) {
          (inclusionRule.Expression.CriteriaList || []).forEach(criteria => {
            // Handle both criteria and windowed criteria
            if (this.isWindowedCriteria(criteria)) {
              if (criteria.Criteria) {
                this.checkCriteriaGroup(criteria.Criteria, 
                  BaseCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
              }
            } else {
              this.checkCriteriaGroup(criteria, 
                BaseCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
            }
          });
        }
      });
    }
  }

  // Type guard to check if an object is a WindowedCriteria
  private isWindowedCriteria(criteria: any): criteria is WindowedCriteria {
    return criteria && 'Window' in criteria && 'Criteria' in criteria;
  }
  
  // Type guard to check if an object has correlatedCriteria property
  private hasCorrelatedCriteria(criteria: any): boolean {
    return criteria && 'CorrelatedCriteria' in criteria && criteria.CorrelatedCriteria !== undefined;
  }
  
  protected checkCriteriaGroup(criteria: ICriteria, groupName: string, reporter: WarningReporter): void {
    this.checkCriteria(criteria as Criteria, groupName, reporter);
    
    // Check if the criteria has correlated criteria (using a safer approach that handles different formats)
    const correlatedCriteria = (criteria as any).correlatedCriteria || (criteria as any).CorrelatedCriteria;
    
    if (correlatedCriteria) {
      const checkCorrelatedCriteria = (corelatedCriteria: ICorelatedCriteria) => {
        if (corelatedCriteria.Criteria) {
          this.checkCriteriaGroup(corelatedCriteria.Criteria, groupName, reporter);
        }
      };
      
      // Check correlated criteria lists
      (correlatedCriteria.CriteriaList || []).forEach(checkCorrelatedCriteria);
      
      // Check correlated criteria in groups
      (correlatedCriteria.Groups || []).forEach((group: any) => 
        (group.CriteriaList || []).forEach(checkCorrelatedCriteria));
    }
  }
  
  protected abstract checkCriteria(criteria: Criteria, groupName: string, reporter: WarningReporter): void;
}