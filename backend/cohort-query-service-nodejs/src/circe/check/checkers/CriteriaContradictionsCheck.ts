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

import { CohortExpression, CorelatedCriteria, Occurrence } from '../../cohortdefinition/CohortExpression';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { Comparisons } from './Comparisons';

interface Range<T> {
  minimum: T;
  maximum: T;
  isOverlappedBy(other: Range<T>): boolean;
}

class NumericRange implements Range<number> {
  constructor(public minimum: number, public maximum: number) {}
  
  isOverlappedBy(other: Range<number>): boolean {
    return !(this.maximum < other.minimum || this.minimum > other.maximum);
  }
}

class CriteriaInfo {
  constructor(public Name: string, public Criteria: CorelatedCriteria) {}
}

export class CriteriaContradictionsCheck extends BaseCorelatedCriteriaCheck {
  private static readonly WARNING = "%s might be contradicted with %s and possibly will lead to 0 records";
  private CriteriaList: CriteriaInfo[] = [];
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected afterCheck(reporter: WarningReporter, expression: CohortExpression): void {
    if (this.CriteriaList.length > 1) {
      const size = this.CriteriaList.length;
      
      for (let i = 0; i < size - 1; i++) {
        const info = this.CriteriaList[i];
        
        for (let j = i + 1; j < size; j++) {
          const ci = this.CriteriaList[j];
          
          // First check if both criteria objects exist
          if (info.Criteria.Criteria && ci.Criteria.Criteria) {
            // Check if the criteria are about the same concept/codeset
            const isSameCodeset = this.hasSameCodeset(info.Criteria.Criteria, ci.Criteria.Criteria);
            
            // Create ObservationFilter-like objects for comparison
            const critInfoFilter = {
              observationTypeExclude: false,
              observationType: [],
              // Add properties from criteria that might be used in comparison
              ...info.Criteria.Criteria
            };
            
            const critCiFilter = {
              observationTypeExclude: false,
              observationType: [],
              // Add properties from criteria that might be used in comparison
              ...ci.Criteria.Criteria
            };
            
            // Check if criteria refer to the same thing but with contradictory occurrences
            const sameBaseCriteria = Comparisons.compareTo(critInfoFilter as any, critCiFilter as any) === 0;
            const contradictoryOccurrences = this.checkContradiction(info.Criteria.Occurrence, ci.Criteria.Occurrence);
            
            // Also check if they have the same CodesetId, which is most common
            if ((sameBaseCriteria || isSameCodeset) && contradictoryOccurrences) {
              reporter.add(CriteriaContradictionsCheck.WARNING, info.Name, ci.Name);
            }
          }
        }
      }
    }
  }
  
  // Helper method to check if two criteria refer to the same codeset
  private hasSameCodeset(criteria1: any, criteria2: any): boolean {
    // Both must have CodesetId property
    if (criteria1.CodesetId === undefined || criteria2.CodesetId === undefined) {
      return false;
    }
    
    // Both must reference the same codeset
    return criteria1.CodesetId === criteria2.CodesetId;
  }
  
  private checkContradiction(o1: Occurrence, o2: Occurrence): boolean {
    const range1 = this.getOccurrenceRange(o1);
    const range2 = this.getOccurrenceRange(o2);
    
    return !range1.isOverlappedBy(range2);
  }
  
  private getOccurrenceRange(occurrence?: Occurrence): Range<number> {
    let result: Range<number>;
    
    // Default range if no occurrence specified (matches everything)
    if (!occurrence) {
      return new NumericRange(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    }
    
    switch (occurrence.Type) {
      case 0: // exactly
        result = new NumericRange(occurrence.Count, occurrence.Count);
        break;
      case 1: // at least
        result = new NumericRange(occurrence.Count, Number.MAX_SAFE_INTEGER);
        break;
      case 2: // at most
        result = new NumericRange(Number.MIN_SAFE_INTEGER, occurrence.Count);
        break;
      default:
        result = new NumericRange(0, 0);
    }
    
    return result;
  }
  
  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    const name = groupName + " " + CriteriaNameHelper.getCriteriaName(criteria.Criteria);
    this.CriteriaList.push(new CriteriaInfo(name, criteria));
  }
}