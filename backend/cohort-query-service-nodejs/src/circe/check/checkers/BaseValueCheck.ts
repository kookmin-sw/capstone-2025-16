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
 *   Authors: Sergey Suvorov
 *
 */

import { 
  CohortExpression, 
  Criteria, 
  PrimaryCriteria, 
  CriteriaGroup, 
  CorelatedCriteria, 
  DemographicCriteria,
  InclusionRule,
  WindowedCriteria
} from '../../cohortdefinition/CohortExpression';
import {
  ICriteria,
  ICriteriaGroup,
  ICorelatedCriteria,
  IDemographicCriteria,
  IWindowedCriteria
} from '../../cohortdefinition/CriteriaInterfaces';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { BaseCheckerFactory } from './BaseCheckerFactory';

export abstract class BaseValueCheck extends BaseCheck {
  protected static readonly INCLUSION_CRITERIA = "Inclusion criteria ";
  protected static readonly PRIMARY_CRITERIA = "Primary criteria";
  protected static readonly ADDITIONAL_CRITERIA = "Additional criteria";
  protected static readonly CENSORING_CRITERIA = "Censoring events";

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    this.checkPrimaryCriteria(expression.PrimaryCriteria, reporter);
    this.checkAdditionalCriteria(expression.AdditionalCriteria, reporter);
    this.checkInclusionRules(expression, reporter);
    this.checkCensoringCriteria(expression, reporter);
  }

  protected checkPrimaryCriteria(primaryCriteria: PrimaryCriteria | undefined, reporter: WarningReporter): void {
    if (primaryCriteria && primaryCriteria.CriteriaList) {
      primaryCriteria.CriteriaList.forEach(criteria => 
        this.checkCriteriaInstance(criteria, reporter, BaseValueCheck.PRIMARY_CRITERIA));
    }
  }

  protected checkAdditionalCriteria(criteriaGroup: CriteriaGroup | undefined, reporter: WarningReporter): void {
    if (criteriaGroup) {
      if (criteriaGroup.CriteriaList) {
        criteriaGroup.CriteriaList.forEach(criteria => {
          if (this.isWindowedCriteria(criteria)) {
            if (criteria.Criteria) {
              this.checkCriteriaInstance(criteria.Criteria, reporter, BaseValueCheck.ADDITIONAL_CRITERIA);
            }
          } else {
            this.checkCriteriaInstance(criteria, reporter, BaseValueCheck.ADDITIONAL_CRITERIA);
          }
        });
      }
      
      if (criteriaGroup.DemographicCriteriaList) {
        criteriaGroup.DemographicCriteriaList.forEach(criteria => 
          this.checkDemographicCriteriaInstance(criteria, reporter, BaseValueCheck.ADDITIONAL_CRITERIA));
      }
      
      if (criteriaGroup.Groups) {
        criteriaGroup.Groups.forEach(group => 
          this.checkAdditionalCriteria(group, reporter));
      }
    }
  }

  protected checkCensoringCriteria(expression: CohortExpression, reporter: WarningReporter): void {
    if (expression.CensoringCriteria) {
      expression.CensoringCriteria.forEach(criteria => 
        this.checkCorelatedCriteriaInstance(criteria, reporter, BaseValueCheck.CENSORING_CRITERIA));
    }
  }

  protected checkInclusionRules(expression: CohortExpression, reporter: WarningReporter): void {
    if (expression.InclusionRules) {
      expression.InclusionRules.forEach(rule => {
        if (rule.Expression) {
          if (rule.Expression.CriteriaList) {
            rule.Expression.CriteriaList.forEach(criteria => {
              if (this.isWindowedCriteria(criteria)) {
                if (criteria.Criteria) {
                  this.checkCriteriaInstance(criteria.Criteria, reporter, 
                    BaseValueCheck.INCLUSION_CRITERIA + '"' + rule.Name + '"');
                }
              } else {
                this.checkCriteriaInstance(criteria, reporter, 
                  BaseValueCheck.INCLUSION_CRITERIA + '"' + rule.Name + '"');
              }
            });
          }
          
          if (rule.Expression.DemographicCriteriaList) {
            rule.Expression.DemographicCriteriaList.forEach(criteria => 
              this.checkDemographicCriteriaInstance(criteria, reporter, 
                BaseValueCheck.INCLUSION_CRITERIA + '"' + rule.Name + '"'));
          }
        }
      });
    }
  }

  // Type guards for different criteria types
  
  // Check if an object is a WindowedCriteria
  private isWindowedCriteria(criteria: any): criteria is WindowedCriteria {
    return criteria && 'Window' in criteria && 'Criteria' in criteria;
  }

  // Check if an object is a CorelatedCriteria
  private isCorelatedCriteria(criteria: any): criteria is CorelatedCriteria {
    return criteria && 
           (('StartWindow' in criteria) || ('EndWindow' in criteria)) && 
           'Criteria' in criteria;
  }

  // Check if an object is a DemographicCriteria
  private isDemographicCriteria(criteria: any): criteria is DemographicCriteria {
    return criteria && criteria.CriteriaType === 'DemographicCriteria';
  }

  // Main method to check a criteria instance by determining its type
  protected checkCriteriaInstance(criteria: ICriteria, reporter: WarningReporter, name: string): void {
    if (!criteria) return;
    
    // Check if it's a correlated criteria
    if (this.isCorelatedCriteria(criteria as any)) {
      this.checkCorelatedCriteriaInstance(criteria as any, reporter, name);
      return;
    }
    
    // Check if it has a nested criteria property
    if ('Criteria' in criteria && criteria.Criteria) {
      this.checkCriteriaInstance(criteria.Criteria, reporter, name);
      return;
    }
    
    // Check if it's a demographic criteria
    if (this.isDemographicCriteria(criteria as any)) {
      this.checkDemographicCriteriaInstance(criteria as any, reporter, name);
      return;
    }
    
    // Default factory-based check for standard criteria
    this.getFactory(reporter, name).check(criteria as any);
  }

  // Method for checking correlated criteria
  protected checkCorelatedCriteriaInstance(criteria: ICorelatedCriteria, reporter: WarningReporter, name: string): void {
    if (criteria && criteria.Criteria) {
      this.checkCriteriaInstance(criteria.Criteria, reporter, name);
    }
  }

  // Method for checking demographic criteria
  protected checkDemographicCriteriaInstance(criteria: IDemographicCriteria, reporter: WarningReporter, name: string): void {
    this.getFactory(reporter, name).check(criteria as any);
  }
  
  // Method to check criteria group with correlated criteria
  protected checkCorrelatedCriteriaGroup(corelatedGroup: any, reporter: WarningReporter, name: string): void {
    if (!corelatedGroup) return;
    
    if (corelatedGroup.CriteriaList) {
      corelatedGroup.CriteriaList.forEach((criteria: ICorelatedCriteria) => 
        this.checkCorelatedCriteriaInstance(criteria, reporter, name));
    }
    
    if (corelatedGroup.Groups) {
      corelatedGroup.Groups.forEach((group: ICriteriaGroup) => {
        if (group && group.CriteriaList) {
          group.CriteriaList.forEach((criteria: any) => {
            if ('StartWindow' in criteria) {
              this.checkCorelatedCriteriaInstance(criteria as ICorelatedCriteria, reporter, name);
            } else if ('Window' in criteria && criteria.Criteria) {
              this.checkCriteriaInstance(criteria.Criteria, reporter, name);
            } else {
              this.checkCriteriaInstance(criteria as ICriteria, reporter, name);
            }
          });
        }
      });
    }
  }

  protected abstract getFactory(reporter: WarningReporter, name: string): BaseCheckerFactory;
}