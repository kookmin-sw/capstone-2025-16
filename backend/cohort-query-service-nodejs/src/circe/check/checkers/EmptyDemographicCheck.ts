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
 *   Authors: Sergey Suvorov, Vitaly Koulakov
 *
 */

import { 
  CohortExpression, 
  Criteria, 
  DemographicCriteria,
  PrimaryCriteria,
  CriteriaGroup,
  CorelatedCriteria
} from '../../cohortdefinition/CohortExpression';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { Constants } from '../Constants';

export class EmptyDemographicCheck extends BaseCheck {
  private static readonly WARNING_EMPTY_VALUE = "%s in the %s does not have attributes";
  
  protected static readonly INCLUSION_CRITERIA = "Inclusion criteria ";
  protected static readonly PRIMARY_CRITERIA = "Primary criteria";
  protected static readonly ADDITIONAL_CRITERIA = "Additional criteria";
  protected static readonly CENSORING_CRITERIA = "Censoring events";

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    this.checkPrimaryCriteria(expression.PrimaryCriteria, reporter);
    this.checkAdditionalCriteria(expression.AdditionalCriteria, reporter);
    this.checkInclusionRules(expression, reporter);
    this.checkCensoringCriteria(expression, reporter);
  }

  protected checkPrimaryCriteria(primaryCriteria: PrimaryCriteria | undefined, reporter: WarningReporter): void {
    if (primaryCriteria && primaryCriteria.CriteriaList) {
      primaryCriteria.CriteriaList.forEach(criteria => 
        this.checkCriteria(criteria, reporter, EmptyDemographicCheck.PRIMARY_CRITERIA));
    }
  }

  protected checkAdditionalCriteria(criteriaGroup: CriteriaGroup | undefined, reporter: WarningReporter): void {
    if (criteriaGroup) {
      if (criteriaGroup.CriteriaList) {
        criteriaGroup.CriteriaList.forEach(criteria => 
          this.checkCriteria(criteria, reporter, EmptyDemographicCheck.ADDITIONAL_CRITERIA));
      }
      if (criteriaGroup.DemographicCriteriaList) {
        criteriaGroup.DemographicCriteriaList.forEach(criteria => 
          this.checkCriteria(criteria, reporter, EmptyDemographicCheck.ADDITIONAL_CRITERIA));
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
        this.checkCriteria(criteria, reporter, EmptyDemographicCheck.CENSORING_CRITERIA));
    }
  }

  protected checkInclusionRules(expression: CohortExpression, reporter: WarningReporter): void {
    if (expression.InclusionRules) {
      expression.InclusionRules.forEach(rule => {
        if (rule.Expression) {
          if (rule.Expression.CriteriaList) {
            rule.Expression.CriteriaList.forEach(criteria => 
              this.checkCriteria(criteria, reporter, EmptyDemographicCheck.INCLUSION_CRITERIA + "\"" + rule.Name + "\""));
          }
          if (rule.Expression.DemographicCriteriaList) {
            rule.Expression.DemographicCriteriaList.forEach(criteria => 
              this.checkCriteria(criteria, reporter, EmptyDemographicCheck.INCLUSION_CRITERIA + "\"" + rule.Name + "\""));
          }
        }
      });
    }
  }

  // Single method that handles all criteria types with type guards
  protected checkCriteria(criteria: any, reporter: WarningReporter, name: string): void {
    if (!criteria) return;
    
    // Handle CorelatedCriteria
    if (criteria.Criteria) {
      this.checkCriteria(criteria.Criteria, reporter, name);
      return;
    }
    
    // Handle CriteriaGroup
    if (criteria.Groups || criteria.CriteriaList || criteria.DemographicCriteriaList) {
      if (criteria.DemographicCriteriaList) {
        criteria.DemographicCriteriaList.forEach((c: DemographicCriteria) => 
          this.checkDemographicCriteria(c, reporter, name));
      }
      if (criteria.CriteriaList) {
        criteria.CriteriaList.forEach((c: any) => 
          this.checkCriteria(c, reporter, name));
      }
      if (criteria.Groups) {
        criteria.Groups.forEach((group: CriteriaGroup) => 
          this.checkCriteria(group, reporter, name));
      }
      return;
    }
    
    // Handle DemographicCriteria
    if (criteria.CriteriaType === "DemographicCriteria") {
      this.checkDemographicCriteria(criteria as DemographicCriteria, reporter, name);
      return;
    }
    
    // Handle regular Criteria with correlated criteria
    if (criteria.CorrelatedCriteria) {
      this.checkCriteria(criteria.CorrelatedCriteria, reporter, name);
    }
  }

  // Specific method for demographic criteria
  protected checkDemographicCriteria(criteria: DemographicCriteria, reporter: WarningReporter, name: string): void {
    this.checkAttribute(
      reporter, 
      name, 
      Constants.Criteria.DEMOGRAPHIC, 
      [
        criteria.Age, 
        criteria.Gender, 
        criteria.Race, 
        criteria.Ethnicity, 
        criteria.OccurrenceStartDate, 
        criteria.OccurrenceEndDate
      ]
    );
  }

  private checkAttribute(reporter: WarningReporter, groupName: string, criteriaName: string, attributes: any[]): void {
    const hasValue = attributes.some(attr => attr !== null && attr !== undefined);
    if (!hasValue) {
      reporter.add(EmptyDemographicCheck.WARNING_EMPTY_VALUE, groupName, criteriaName);
    }
  }
}