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

import { 
  Criteria, 
  Window, 
  NumericRange, 
  DateRange, 
  Period,
  ConditionEra,
  ConditionOccurrence,
  Death,
  DeviceExposure,
  DoseEra,
  DrugEra,
  DrugExposure,
  Measurement,
  Observation,
  ProcedureOccurrence,
  Specimen,
  VisitOccurrence,
  VisitDetail,
  ObservationFilter
} from '../../cohortdefinition/CohortExpression';
import { IWindow, INumericRange } from '../../cohortdefinition/CriteriaInterfaces';
import Concept from '../../vocabulary/Concept';
import { ConceptSet } from '../../cohortdefinition/ConceptSet';

// Define interfaces for Window.Endpoint to avoid namespace usage issues
interface WindowEndpoint {
  coeff: number;
  days: number;
}

export class Comparisons {
  // Add missing methods referenced in other classes
  public static compare(filter: ObservationFilter, window: IWindow): number {
    return Comparisons.compareTo(filter, window);
  }
  
  public static isBefore(window?: IWindow): boolean {
    return Comparisons.isWindowBefore(window);
  }
  
  // Helper method to check if an object is a NumericRange
  private static isNumericRange(obj: any): obj is NumericRange {
    return obj && 'Value' in obj && 'Op' in obj;
  }
  
  // Helper method to check if an object is a DateRange
  private static isDateRange(obj: any): obj is DateRange {
    return obj && 'StartDate' in obj && 'EndDate' in obj;
  }
  
  // Helper method to check if an object is a Period
  private static isPeriod(obj: any): obj is Period {
    return obj && 'StartDate' in obj && 'EndDate' in obj && 
           typeof (obj as Period).StartDate.getTime === 'function';
  }

  // Overloaded method for checking if start is greater than end
  public static startIsGreaterThanEnd(range: NumericRange | DateRange | Period): boolean {
    if (Comparisons.isNumericRange(range)) {
      return Comparisons.startIsGreaterThanEndNumeric(range);
    } else if (Comparisons.isPeriod(range)) {
      return Comparisons.startIsGreaterThanEndPeriod(range);
    } else {
      return Comparisons.startIsGreaterThanEndDate(range as DateRange);
    }
  }
  
  // Implementation for NumericRange
  private static startIsGreaterThanEndNumeric(r: NumericRange): boolean {
    return r.Value !== undefined && r.Value !== null && 
           r.Extent !== undefined && r.Extent !== null && 
           Number(r.Value) > Number(r.Extent);
  }
  
  // Implementation for DateRange
  private static startIsGreaterThanEndDate(r: DateRange): boolean {
    try {
      return r.StartDate !== undefined && r.StartDate !== null && 
             r.EndDate !== undefined && r.EndDate !== null && 
             new Date(r.StartDate) > new Date(r.EndDate);
    } catch (e) {
      return false;
    }
  }
  
  // Implementation for Period
  private static startIsGreaterThanEndPeriod(p: Period): boolean {
    try {
      if (p.StartDate !== undefined && p.StartDate !== null && 
          p.EndDate !== undefined && p.EndDate !== null) {
        const startDate = new Date(p.StartDate);
        const endDate = new Date(p.EndDate);
        return startDate > endDate;
      }
    } catch (e) {
      // Ignore date parse errors
    }
    return false;
  }
  
  public static isDateValid(date: string): boolean {
    try {
      const d = new Date(date);
      return !isNaN(d.getTime());
    } catch (e) {
      return false;
    }
  }
  
  public static isStartNegative(r: NumericRange): boolean {
    return r.Value !== undefined && r.Value !== null && Number(r.Value) < 0;
  }
  
  // Helper methods to avoid overloaded methods with the same name
  
  // Concept comparison
  public static compareConceptValues(source: Concept): (concept: Concept) => boolean {
    return (concept: Concept) => {
      return concept.ConceptCode === source.ConceptCode &&
             concept.DomainId === source.DomainId &&
             concept.VocabularyId === source.VocabularyId;
    };
  }
  
  // ConceptSet comparison
  public static compareConceptSets(source: ConceptSet): (conceptSet: ConceptSet) => boolean {
    return (conceptSet: ConceptSet) => {
      if (conceptSet.Expression === source.Expression) {
        return true;
      }
      
      if (conceptSet.Expression && source.Expression) {
        if (conceptSet.Expression.Items.length === source.Expression.Items.length) {
          const sourceConcepts = source.Expression.Items.map(item => item.Concept);
          
          return conceptSet.Expression.Items.every(item => {
            return sourceConcepts.some(sourceConcept => 
              Comparisons.compareConceptValues(sourceConcept)(item.Concept));
          });
        }
      }
      
      return false;
    };
  }
  
  public static compareTo(filter: ObservationFilter, window: IWindow): number {
    // Update the method to use the interface properties that exist
    const range1 = (filter.ObservationType?.length || 0); // Using as a fallback since PriorDays/PostDays don't exist
    let range2Start = 0, range2End = 0;
    
    if (window.Start && window.Start.Value !== undefined && window.Start.Value !== null) {
      range2Start = (window.Start.Op === 'lt' ? -1 : 1) * window.Start.Value;
    }
    
    if (window.End && window.End.Value !== undefined && window.End.Value !== null) {
      range2End = (window.End.Op === 'lt' ? -1 : 1) * window.End.Value;
    }
    
    return range1 - (range2End - range2Start);
  }
  
  // Criteria comparison
  public static compareCriteria(c1: Criteria, c2: Criteria): boolean {
    let result = false;
    
    // Use CriteriaType for comparison instead of property check
    if (c1.CriteriaType === c2.CriteriaType) {
      result = c1.CodesetId === c2.CodesetId;
    }
    
    return result;
  }
  
  // Window before check  
  public static isWindowBefore(window?: IWindow): boolean {
    return window !== undefined && window !== null && 
           Comparisons.isEndpointBefore(window.Start) && 
           !Comparisons.isEndpointAfter(window.End);
  }
  
  // Endpoint before check
  public static isEndpointBefore(endpoint?: INumericRange | null): boolean {
    return endpoint !== undefined && endpoint !== null && 
           endpoint.Value !== undefined && endpoint.Value !== null &&
           endpoint.Op === 'lt' && endpoint.Value > 0;
  }
  
  // Endpoint after check
  public static isEndpointAfter(endpoint?: INumericRange | null): boolean {
    return endpoint !== undefined && endpoint !== null && 
           endpoint.Value !== undefined && endpoint.Value !== null &&
           endpoint.Op === 'gt' && endpoint.Value > 0;
  }
}