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
import { WarningSeverity } from '../warnings/WarningSeverity';
import { Warning } from '../warnings/Warning';
import { ConceptSetWarning } from '../warnings/ConceptSetWarning';
import { CohortExpression, Criteria, CriteriaGroup, CorelatedCriteria, CustomEraStrategy } from '../../cohortdefinition/CohortExpression';
import { ConceptSet } from '../../cohortdefinition/ConceptSet';
import { CriteriaCheckerFactory } from './CriteriaCheckerFactory';

export class UnusedConceptsCheck extends BaseCheck {
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected getReporter(severity: WarningSeverity, warnings: Warning[]): WarningReporter {
    return {
      add: (template: string, ...params: any[]) => {
        warnings.push(new ConceptSetWarning(severity, template, params[0] as ConceptSet));
      }
    };
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    const additionalCriteria = this.getAdditionalCriteria(expression);
    
    (expression.ConceptSets || [])
      .filter(conceptSet => this.isNotUsed(expression, additionalCriteria, conceptSet))
      .forEach(conceptSet => reporter.add("Concept Set \"%s\" is not used", conceptSet));
  }
  
  private getAdditionalCriteria(expression: CohortExpression): Criteria[] {
    if (!expression.AdditionalCriteria) {
      return [];
    }
    
    let additionalCriteria: Criteria[] = [];
    
    if (expression.AdditionalCriteria.CriteriaList) {
      additionalCriteria = additionalCriteria.concat(
        this.toCriteriaList(expression.AdditionalCriteria.CriteriaList)
      );
    }
    
    if (expression.AdditionalCriteria.Groups) {
      additionalCriteria = additionalCriteria.concat(
        this.toCriteriaList(expression.AdditionalCriteria.Groups)
      );
    }
    
    return additionalCriteria;
  }
  
  private isNotUsed(expression: CohortExpression, additionalCriteria: Criteria[], conceptSet: ConceptSet): boolean {
    return !this.isUsed(expression, additionalCriteria, conceptSet);
  }
  
  private isUsed(expression: CohortExpression, additionalCriteria: Criteria[], conceptSet: ConceptSet): boolean {
    // Check primary criteria
    if (this.isConceptSetUsedInCriteriaList(conceptSet, expression.PrimaryCriteria.CriteriaList)) {
      return true;
    }
    
    // Check additional criteria
    if (this.isConceptSetUsedInCriteriaList(conceptSet, additionalCriteria)) {
      return true;
    }
    
    // Check inclusion rules
    if (expression.InclusionRules && expression.InclusionRules.some(rule => 
      rule.Expression && this.isConceptSetUsedInGroup(conceptSet, rule.Expression))) {
      return true;
    }
    
    // Check end strategy
    if (expression.EndStrategy && 
        expression.EndStrategy.hasOwnProperty('CustomEra') && 
        (expression.EndStrategy as CustomEraStrategy).DrugCodesetId === conceptSet.Id) {
      return true;
    }
    
    // Check censoring criteria
    return expression.CensoringCriteria && 
      // Convert to compatible type before passing to isConceptSetUsedInCriteriaList
      this.isConceptSetUsedInCriteriaList(conceptSet, expression.CensoringCriteria as unknown as Criteria[]);
  }
  
  // Overloaded method for Criteria[]
  private isConceptSetUsedInCriteriaList(conceptSet: ConceptSet, criteriaList: Criteria[] = []): boolean {
    const factory = CriteriaCheckerFactory.getFactory(conceptSet);
    
    const mainCheck = criteriaList.some(criteria => 
      factory.getCriteriaChecker(criteria)(criteria));
    
    if (mainCheck) {
      return true;
    }
    
    // Check correlated criteria
    return criteriaList.some(criteria => {
      if (criteria.CorrelatedCriteria) {
        return this.isConceptSetUsedInCriteriaList(conceptSet, criteria.CorrelatedCriteria);
      }
      return false;
    });
  }
  
  // Overloaded method for CriteriaGroup
  private isConceptSetUsedInGroup(conceptSet: ConceptSet, group: CriteriaGroup): boolean {
    const criteriaList = this.toCriteriaList(group.CriteriaList);
    
    if (this.isConceptSetUsedInCriteriaList(conceptSet, criteriaList)) {
      return true;
    }
    
    return group.Groups && group.Groups.some(cg => 
      this.isConceptSetUsedInGroup(conceptSet, cg));
  }
  
  // Generic method that routes to the appropriate implementation
  private isConceptSetUsed(conceptSet: ConceptSet, obj: any): boolean {
    if (Array.isArray(obj)) {
      return this.isConceptSetUsedInCriteriaList(conceptSet, obj);
    } else if (obj && obj.Groups) {
      return this.isConceptSetUsedInGroup(conceptSet, obj);
    }
    return false;
  }
  
  // Type guard to help identify types
  private isCorelatedCriteriaArray(arr: any[]): arr is CorelatedCriteria[] {
    return arr.length > 0 && arr[0] && 'criteria' in arr[0];
  }
  
  private isCriteriaGroupArray(arr: any[]): arr is CriteriaGroup[] {
    return arr.length > 0 && arr[0] && 'groups' in arr[0];
  }
  
  // Generic function that handles both types
  private toCriteriaList(items: any[] = []): Criteria[] {
    if (!items || items.length === 0) return [];
    
    // CorelatedCriteria[]
    if (this.isCorelatedCriteriaArray(items)) {
      return items.map(c => c.Criteria).filter(c => c !== undefined);
    }
    
    // CriteriaGroup[]
    if (this.isCriteriaGroupArray(items)) {
      let criteria: Criteria[] = [];
      
      // Get criteria from all groups
      for (const group of items as CriteriaGroup[]) {
        if (group.CriteriaList) {
          const corelatedCriteria = group.CriteriaList
            // Make sure we only include items that have criteria property
            .filter(c => c && typeof c === 'object' && 'Criteria' in c && c.Criteria)
            // Extract the criteria from the object
            .map(c => (c as any).Criteria);
          criteria = criteria.concat(corelatedCriteria);
        }
        
        // Recursively get criteria from child groups
        if (group.Groups) {
          criteria = criteria.concat(this.toCriteriaList(group.Groups));
        }
      }
      
      return criteria;
    }
    
    // Unknown type or simple criteria array
    return items as Criteria[];
  }
}