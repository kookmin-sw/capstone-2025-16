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

import { BaseValueCheck } from './BaseValueCheck';
import { BaseCheckerFactory } from './BaseCheckerFactory';
import { WarningReporter } from './WarningReporter';
import { RangeCheckerFactory } from './RangeCheckerFactory';
import { 
  CohortExpression, 
  CorelatedCriteria, 
  InclusionRule,
  ObservationFilter,
  Window
} from '../../cohortdefinition/CohortExpression';
import { 
  ICorelatedCriteria,
  IWindow 
} from '../../cohortdefinition/CriteriaInterfaces';
import { Constants } from '../Constants';

export class RangeCheck extends BaseValueCheck {
  private static readonly NEGATIVE_VALUE_ERROR = "Time window in criteria \"%s\" has negative value %d at %s";

  protected getFactory(reporter: WarningReporter, name: string): BaseCheckerFactory {
    return RangeCheckerFactory.getFactory(reporter, name);
  }

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    super.checkInternal(expression, reporter);
    RangeCheckerFactory.getFactory(reporter, BaseValueCheck.PRIMARY_CRITERIA).check(expression);
    
    if (expression.PrimaryCriteria) {
      this.checkObservationFilter(expression.PrimaryCriteria.ObservationWindow, reporter, "observation window");
    }
    
    // Use public method from RangeCheckerFactory instead of private checkRange method
    const factory = RangeCheckerFactory.getFactory(reporter, BaseValueCheck.PRIMARY_CRITERIA);
    factory.check(expression.CensorWindow, "cohort", Constants.Attributes.CENSOR_WINDOW_ATTR);
  }

  protected checkInclusionRules(expression: CohortExpression, reporter: WarningReporter): void {
    super.checkInclusionRules(expression, reporter);
    
    if (expression.InclusionRules) {
      for (const rule of expression.InclusionRules) {
        if (rule.Expression) {
          for (const criteria of rule.Expression.CriteriaList) {
            if ('StartWindow' in criteria) {
              this.checkCriteriaInstance(criteria as ICorelatedCriteria, reporter, rule.Name);
            }
          }
        }
      }
    }
  }
  
  // Override the method from BaseValueCheck to use our custom implementation
  protected checkCriteriaInstance(criteria: any, reporter: WarningReporter, name: string): void {
    // Use our implementation instead of calling super
    
    // Check if the criteria has the relevant properties for being a correlated criteria
    if (criteria && (criteria.StartWindow || criteria.EndWindow)) {
      this.checkCriteriaCorelated(criteria as ICorelatedCriteria, reporter, name);
    } else {
      // For other criteria types, delegate to factory
      this.getFactory(reporter, name).check(criteria);
    }
  }

  // Use a different name to avoid method overloading
  protected checkCriteriaCorelated(criteria: ICorelatedCriteria, reporter: WarningReporter, name: string): void {
    // Use a specific name to avoid conflicts with parent class
    if (criteria) {
      this.checkWindow(criteria.StartWindow, reporter, name);
      this.checkWindow(criteria.EndWindow, reporter, name);
    }
  }

  private checkWindow(window: IWindow | undefined, reporter: WarningReporter, name: string): void {
    if (window) {
      if (window.Start && window.Start.Value !== undefined && window.Start.Value !== null && window.Start.Value < 0) {
        reporter.add(RangeCheck.NEGATIVE_VALUE_ERROR, name, window.Start.Value, "start");
      }
      if (window.End && window.End.Value !== undefined && window.End.Value !== null && window.End.Value < 0) {
        reporter.add(RangeCheck.NEGATIVE_VALUE_ERROR, name, window.End.Value, "end");
      }
    }
  }

  private checkObservationFilter(filter: IWindow | undefined, reporter: WarningReporter, name: string): void {
    if (filter) {
      // Get prior days from window.Start
      if (filter.Start && filter.Start.Value !== undefined && filter.Start.Value !== null && filter.Start.Value < 0) {
        reporter.add(RangeCheck.NEGATIVE_VALUE_ERROR, name, filter.Start.Value, "prior days");
      }
      // Get post days from window.End
      if (filter.End && filter.End.Value !== undefined && filter.End.Value !== null && filter.End.Value < 0) {
        reporter.add(RangeCheck.NEGATIVE_VALUE_ERROR, name, filter.End.Value, "post days");
      }
    }
  }
}