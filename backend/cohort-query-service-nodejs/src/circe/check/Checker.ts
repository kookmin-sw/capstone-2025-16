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
 *   Authors: Vitaly Koulakov, Sergey Suvorov
 *
 */

import { CohortExpression } from '../cohortdefinition/CohortExpression';
import { Check } from './Check';
import { Warning } from './warnings/Warning';
import { UnusedConceptsCheck } from './checkers/UnusedConceptsCheck';
import { ConceptSetCriteriaCheck } from './checkers/ConceptSetCriteriaCheck';
import { DrugEraCheck } from './checkers/DrugEraCheck';
import { TimePatternCheck } from './checkers/TimePatternCheck';
import { NoExitCriteriaCheck } from './checkers/NoExitCriteriaCheck';
import { DeathTimeWindowCheck } from './checkers/DeathTimeWindowCheck';
import { DuplicatesConceptSetCheck } from './checkers/DuplicatesConceptSetCheck';
import { DuplicatesCriteriaCheck } from './checkers/DuplicatesCriteriaCheck';
import { EmptyConceptSetCheck } from './checkers/EmptyConceptSetCheck';
import { EventsProgressionCheck } from './checkers/EventsProgressionCheck';
import { DomainTypeCheck } from './checkers/DomainTypeCheck';
import { DrugDomainCheck } from './checkers/DrugDomainCheck';
import { EmptyDemographicCheck } from './checkers/EmptyDemographicCheck';
import { CriteriaContradictionsCheck } from './checkers/CriteriaContradictionsCheck';
import { TimeWindowCheck } from './checkers/TimeWindowCheck';
import { ExitCriteriaCheck } from './checkers/ExitCriteriaCheck';
import { ExitCriteriaDaysOffsetCheck } from './checkers/ExitCriteriaDaysOffsetCheck';
import { RangeCheck } from './checkers/RangeCheck';
import { ConceptCheck } from './checkers/ConceptCheck';
import { ConceptSetSelectionCheck } from './checkers/ConceptSetSelectionCheck';
import { AttributeCheck } from './checkers/AttributeCheck';
import { TextCheck } from './checkers/TextCheck';
import { IncompleteRuleCheck } from './checkers/IncompleteRuleCheck';
import { InitialEventCheck } from './checkers/InitialEventCheck';
import { OcurrenceCheck } from './checkers/OcurrenceCheck';
import { FirstTimeInHistoryCheck } from './checkers/FirstTimeInHistoryCheck';

/**
 * Primary checker class that runs all validation checks against a cohort expression
 * This will be expanded as we implement the individual checkers.
 */
export class Checker implements Check {
  /**
   * Returns all available checks to run against a cohort expression
   */
  private getChecks(): Check[] {
    const checks: Check[] = [];
    // Adding checks in the same order as the Java version
    checks.push(new UnusedConceptsCheck());
    checks.push(new ExitCriteriaCheck());
    checks.push(new ExitCriteriaDaysOffsetCheck());
    checks.push(new RangeCheck());
    checks.push(new ConceptCheck());
    checks.push(new ConceptSetSelectionCheck());
    checks.push(new AttributeCheck());
    checks.push(new TextCheck());
    checks.push(new IncompleteRuleCheck());
    checks.push(new InitialEventCheck());
    checks.push(new NoExitCriteriaCheck());
    checks.push(new ConceptSetCriteriaCheck());
    checks.push(new DrugEraCheck());
    checks.push(new OcurrenceCheck());
    checks.push(new DuplicatesCriteriaCheck());
    checks.push(new DuplicatesConceptSetCheck());
    checks.push(new DrugDomainCheck());
    checks.push(new EmptyConceptSetCheck());
    checks.push(new EventsProgressionCheck());
    checks.push(new TimeWindowCheck());
    checks.push(new TimePatternCheck());
    checks.push(new DomainTypeCheck());
    checks.push(new CriteriaContradictionsCheck());
    checks.push(new DeathTimeWindowCheck());
    checks.push(new EmptyDemographicCheck());
    checks.push(new FirstTimeInHistoryCheck());
    return checks;
  }

  /**
   * Run all validation checks on the provided cohort expression
   * @param expression The cohort expression to validate
   * @returns List of warnings found during validation
   */
  check(expression: CohortExpression): Warning[] {
    const result: Warning[] = [];
    for (const check of this.getChecks()) {
      result.push(...check.check(expression));
    }
    return result;
  }
}