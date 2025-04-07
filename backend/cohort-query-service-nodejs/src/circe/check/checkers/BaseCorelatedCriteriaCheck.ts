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

export abstract class BaseCorelatedCriteriaCheck extends BaseIterableCheck {
  // Make the constants match exactly with what BaseCheck expects
  protected static readonly INCLUSION_RULE = "inclusion rule ";
  protected static readonly PRIMARY_CRITERIA = "Primary criteria";
  protected static readonly ADDITIONAL_RULE = "additional rule";
  
  // Make static constants available as instance properties for compatibility
  protected INCLUSION_RULE = BaseCorelatedCriteriaCheck.INCLUSION_RULE;
  protected ADDITIONAL_RULE = BaseCorelatedCriteriaCheck.ADDITIONAL_RULE;
  protected PRIMARY_CRITERIA = BaseCorelatedCriteriaCheck.PRIMARY_CRITERIA;
  
  protected internalCheck(expression: CohortExpression, reporter: WarningReporter): void {
    // Check inclusion rules
    (expression.InclusionRules || []).forEach(inclusionRule => {
      if (inclusionRule.Expression) {
        (inclusionRule.Expression.CriteriaList || []).forEach(criteria => {
          // Check if criteria is a CorelatedCriteria or WindowedCriteria
          if (this.isWindowedCriteria(criteria)) {
            if (criteria.Criteria) {
              // Convert WindowedCriteria to CorelatedCriteria for processing
              const windowedCriteria = criteria as WindowedCriteria;
              const corelatedCriteria = new CorelatedCriteria();
              corelatedCriteria.Criteria = windowedCriteria.Criteria;
              corelatedCriteria.StartWindow = windowedCriteria.Window;
              corelatedCriteria.EndWindow = windowedCriteria.Window;
              // WindowedCriteria doesn't have Occurrence so don't try to copy it
              
              // Process the converted criteria
              this.checkCorelatedCriteria(corelatedCriteria, 
                BaseCorelatedCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
                
              // Also check the inner criteria
              this.checkCriteriaGroup(criteria.Criteria as Criteria, 
                BaseCorelatedCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
            }
          } else if (this.isCorelatedCriteria(criteria)) {
            // For correlated criteria, check both the criteria itself and its inner criteria
            const corelatedCriteria = criteria as CorelatedCriteria;
            this.checkCorelatedCriteria(corelatedCriteria, 
              BaseCorelatedCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
            if (corelatedCriteria.Criteria) {
              this.checkCriteriaGroup(corelatedCriteria.Criteria as Criteria, 
                BaseCorelatedCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
            }
          } else {
            // For regular criteria, just check the criteria group
            this.checkCriteriaGroup(criteria as Criteria, 
              BaseCorelatedCriteriaCheck.INCLUSION_RULE + inclusionRule.Name, reporter);
          }
        })
      }
    });
  }
  
  // Type guards for checking criteria types
  private isWindowedCriteria(criteria: any): criteria is WindowedCriteria {
    return criteria && criteria !== null && typeof criteria === 'object' &&
           'Window' in criteria && 'Criteria' in criteria;
  }
  
  private isCorelatedCriteria(criteria: any): criteria is CorelatedCriteria {
    return criteria && criteria !== null && typeof criteria === 'object' &&
           (('StartWindow' in criteria) || ('EndWindow' in criteria)) && 'Criteria' in criteria;
  }
  
  protected checkCriteriaGroup(criteria: Criteria, groupName: string, reporter: WarningReporter): void {
    // Check if the criteria has correlated criteria (case-insensitive check)
    const correlatedCriteria = (criteria as any).correlatedCriteria || (criteria as any).CorrelatedCriteria;
    
    if (correlatedCriteria) {
      const checkCorrelatedCriteria = (corelatedCriteria: ICorelatedCriteria) => {
        this.checkCorelatedCriteria(corelatedCriteria, groupName, reporter);
        if (corelatedCriteria.Criteria) {
          this.checkCriteriaGroup(corelatedCriteria.Criteria as Criteria, groupName, reporter);
        }
      };
      
      // Check correlated criteria lists
      (correlatedCriteria.CriteriaList || []).forEach(checkCorrelatedCriteria);
      
      // Check correlated criteria in groups
      (correlatedCriteria.Groups || []).forEach((group: any) => 
        (group.CriteriaList || []).forEach(checkCorrelatedCriteria));
    }
  }
  
  // Renamed method to avoid confusion with the abstract method
  protected checkCorelatedCriteria(criteria: ICorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    this.checkCriteria(criteria as CorelatedCriteria, groupName, reporter);
  }
  
  protected abstract checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void;
}