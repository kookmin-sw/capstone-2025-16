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

import { CohortExpression, CorelatedCriteria, Window, NumericRange } from '../../cohortdefinition/CohortExpression';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { IWindowEndpoint } from '../../cohortdefinition/CriteriaInterfaces';

class TimeWindowInfo {
  Name: string;
  Start: Window;
  End: Window;
  
  constructor(name: string, start: Window, end: Window) {
    this.Name = name;
    this.Start = start;
    this.End = end;
  }
  
  getName(): string {
    return this.Name;
  }
  
  getStart(): Window {
    return this.Start;
  }
  
  getEnd(): Window {
    return this.End;
  }
}

export class TimePatternCheck extends BaseCorelatedCriteriaCheck {
  private timeWindowInfoList: TimeWindowInfo[] = [];
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }
  
  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    const name = CriteriaNameHelper.getCriteriaName(criteria.Criteria) + " criteria at " + groupName;
    this.timeWindowInfoList.push(new TimeWindowInfo(name, criteria.StartWindow, criteria.EndWindow));
  }
  
  protected afterCheck(reporter: WarningReporter, expression: CohortExpression): void {
    // Skip if we don't have enough criteria to compare
    if (this.timeWindowInfoList.length < 2) {
      return;
    }
    
    const startDays = this.timeWindowInfoList.map(info => this.startDays(info.Start));
    
    // Count frequency of each start days value
    const freq = new Map<number, number>();
    startDays.forEach(days => {
      const count = freq.get(days) || 0;
      freq.set(days, count + 1);
    });
    
    // Find max frequency
    const maxFreq = Math.max(...Array.from(freq.values()), 0);
    
    if (maxFreq > 1) {
      // Find the first info object with the most common pattern
      const mostCommonInfo = this.timeWindowInfoList.find(ti => {
        const currFreq = freq.get(this.startDays(ti.Start)) || 0;
        return currFreq === maxFreq;
      });
      
      if (mostCommonInfo) {
        this.timeWindowInfoList.forEach(info => {
          const start = this.startDays(info.Start);
          const currFreq = freq.get(start) || 0;
          
          // Only add a warning if this pattern is less common than the most common pattern
          if (maxFreq - currFreq > 0) {
            reporter.add("%s time window differs from most common pattern prior '%s', shouldn't that be a valid pattern?",
              info.getName(), this.formatTimeWindow(mostCommonInfo));
          }
        });
      }
    }
    
    // Additional check for contradicting time patterns
    // For example: events that happen in the past but should happen in the future
    for (let i = 0; i < this.timeWindowInfoList.length - 1; i++) {
      for (let j = i + 1; j < this.timeWindowInfoList.length; j++) {
        const first = this.timeWindowInfoList[i];
        const second = this.timeWindowInfoList[j];
        
        // Check if the first event is supposed to happen after the second event (contradictory)
        const firstStartDays = this.startDays(first.Start);
        const secondStartDays = this.startDays(second.Start);
        
        // If the time windows are reversed (first event happens later than second)
        if (firstStartDays > 0 && secondStartDays < 0) {
          reporter.add("%s and %s have potentially contradictory time windows: the first happens after the second",
            first.getName(), second.getName());
        }
      }
    }
  }
  
  private formatTimeWindow(ti: TimeWindowInfo): string {
    let result = "";
    
    if (ti && ti.Start && ti.Start.Start) {
      result += this.formatDays(ti.Start.Start) + " days " + this.formatCoeff(ti.Start.Start);
    }
    
    if (ti && ti.Start && ti.Start.End) {
      result += " and " + this.formatDays(ti.Start.End) + " days " + this.formatCoeff(ti.Start.End);
    }
    
    return result;
  }
  
  private formatDays(endpoint: NumericRange): string {
    const days = endpoint.Days !== undefined && endpoint.Days !== null ? endpoint.Days : endpoint.Value;
    return days !== undefined && days !== null ? String(days) : "all";
  }
  
  private formatCoeff(endpoint: NumericRange): string {
    const coeff = endpoint.Coeff !== undefined && endpoint.Coeff !== null ? endpoint.Coeff : 
                 (endpoint.Op === "lt" ? -1 : 1);
    return coeff < 0 ? "before " : "after ";
  }
  
  private startDays(window?: Window): number {
    if (!window || !window.Start) return 0;
    
    const days = window.Start.Days !== undefined && window.Start.Days !== null ? 
                window.Start.Days : window.Start.Value || 0;
    
    const coeff = window.Start.Coeff !== undefined && window.Start.Coeff !== null ? 
                 window.Start.Coeff : (window.Start.Op === "lt" ? -1 : 1);
    
    return days * coeff;
  }
}