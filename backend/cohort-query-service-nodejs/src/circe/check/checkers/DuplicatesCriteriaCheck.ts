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
  CohortExpression, 
  Criteria, 
  ConditionEra, 
  ConditionOccurrence, 
  Death, 
  DeviceExposure, 
  DoseEra, 
  DrugEra, 
  DrugExposure, 
  Measurement, 
  Observation, 
  ObservationPeriod, 
  ProcedureOccurrence, 
  Specimen, 
  VisitOccurrence,
  VisitDetail,
  PayerPlanPeriod
} from '../../cohortdefinition/CohortExpression';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCriteriaCheck } from './BaseCriteriaCheck';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { WarningReporter } from './WarningReporter';

// Simple pair class to replace Apache Commons ImmutablePair
class Pair<L, R> {
  constructor(public left: L, public right: R) {}
  
  getLeft(): L {
    return this.left;
  }
  
  getRight(): R {
    return this.right;
  }
}

export class DuplicatesCriteriaCheck extends BaseCriteriaCheck {
  private static readonly DUPLICATE_WARNING = "Probably %s duplicates %s";
  private CriteriaList: Pair<string, Criteria>[] = [];
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected afterCheck(reporter: WarningReporter, expression: CohortExpression): void {
    if (this.CriteriaList.length > 1) {
      for (let i = 0; i <= this.CriteriaList.length - 2; i++) {
        const criteria = this.CriteriaList[i];
        const restOfList = this.CriteriaList.slice(i + 1);
        
        const duplicates = restOfList.filter(pair => 
          this.compareCriteria(criteria.getRight(), pair.getRight()));
        
        if (duplicates.length > 0) {
          const names = duplicates
            .map(pair => pair.getLeft())
            .join(", ");
          
          reporter.add(DuplicatesCriteriaCheck.DUPLICATE_WARNING, criteria.getLeft(), names);
        }
      }
    }
  }
  
  private compareCriteria(c1: Criteria, c2: Criteria): boolean {
    // Check if both criteria have the same type
    const c1Type = Object.keys(c1).find(key => 
      ['ConditionEra', 'ConditionOccurrence', 'Death', 'DeviceExposure', 'DoseEra', 
       'DrugEra', 'DrugExposure', 'Measurement', 'Observation', 'ObservationPeriod',
       'ProcedureOccurrence', 'Specimen', 'VisitOccurrence', 'VisitDetail', 'PayerPlanPeriod'].includes(key));
    
    const c2Type = Object.keys(c2).find(key => 
      ['ConditionEra', 'ConditionOccurrence', 'Death', 'DeviceExposure', 'DoseEra', 
       'DrugEra', 'DrugExposure', 'Measurement', 'Observation', 'ObservationPeriod',
       'ProcedureOccurrence', 'Specimen', 'VisitOccurrence', 'VisitDetail', 'PayerPlanPeriod'].includes(key));
    
    if (c1Type === c2Type) {
      if (c1.hasOwnProperty('ConditionEra') && c2.hasOwnProperty('ConditionEra')) {
        const era1 = c1 as ConditionEra;
        const era2 = c2 as ConditionEra;
        return era1.CodesetId === era2.CodesetId;
      } else if (c1.hasOwnProperty('ConditionOccurrence') && c2.hasOwnProperty('ConditionOccurrence')) {
        const co1 = c1 as ConditionOccurrence;
        const co2 = c2 as ConditionOccurrence;
        return co1.CodesetId === co2.CodesetId && 
               co1.ConditionSourceConcept === co2.ConditionSourceConcept;
      } else if (c1.hasOwnProperty('Death') && c2.hasOwnProperty('Death')) {
        const death1 = c1 as Death;
        const death2 = c2 as Death;
        return death1.CodesetId === death2.CodesetId;
      } else if (c1.hasOwnProperty('DeviceExposure') && c2.hasOwnProperty('DeviceExposure')) {
        const e1 = c1 as DeviceExposure;
        const e2 = c2 as DeviceExposure;
        return e1.CodesetId === e2.CodesetId;
      } else if (c1.hasOwnProperty('DoseEra') && c2.hasOwnProperty('DoseEra')) {
        const d1 = c1 as DoseEra;
        const d2 = c2 as DoseEra;
        return d1.CodesetId === d2.CodesetId;
      } else if (c1.hasOwnProperty('DrugEra') && c2.hasOwnProperty('DrugEra')) {
        const drug1 = c1 as DrugEra;
        const drug2 = c2 as DrugEra;
        return drug1.CodesetId === drug2.CodesetId;
      } else if (c1.hasOwnProperty('DrugExposure') && c2.hasOwnProperty('DrugExposure')) {
        const de1 = c1 as DrugExposure;
        const de2 = c2 as DrugExposure;
        return de1.CodesetId === de2.CodesetId;
      } else if (c1.hasOwnProperty('Measurement') && c2.hasOwnProperty('Measurement')) {
        const m1 = c1 as Measurement;
        const m2 = c2 as Measurement;
        return m1.CodesetId === m2.CodesetId;
      } else if (c1.hasOwnProperty('Observation') && c2.hasOwnProperty('Observation')) {
        const o1 = c1 as Observation;
        const o2 = c2 as Observation;
        return o1.CodesetId === o2.CodesetId;
      } else if (c1.hasOwnProperty('ObservationPeriod') && c2.hasOwnProperty('ObservationPeriod')) {
        const op1 = c1 as ObservationPeriod;
        const op2 = c2 as ObservationPeriod;
        return this.deepEquals(op1.PeriodStartDate, op2.PeriodStartDate) &&
               this.deepEquals(op1.PeriodEndDate, op2.PeriodEndDate) &&
               this.deepEquals(op1.PeriodLength, op2.PeriodLength);
      } else if (c1.hasOwnProperty('ProcedureOccurrence') && c2.hasOwnProperty('ProcedureOccurrence')) {
        const p1 = c1 as ProcedureOccurrence;
        const p2 = c2 as ProcedureOccurrence;
        return p1.CodesetId === p2.CodesetId;
      } else if (c1.hasOwnProperty('Specimen') && c2.hasOwnProperty('Specimen')) {
        const s1 = c1 as Specimen;
        const s2 = c2 as Specimen;
        return s1.CodesetId === s2.CodesetId;
      } else if (c1.hasOwnProperty('VisitOccurrence') && c2.hasOwnProperty('VisitOccurrence')) {
        const vo1 = c1 as VisitOccurrence;
        const vo2 = c2 as VisitOccurrence;
        return vo1.CodesetId === vo2.CodesetId;
      } else if (c1.hasOwnProperty('VisitDetail') && c2.hasOwnProperty('VisitDetail')) {
        const vd1 = c1 as VisitDetail;
        const vd2 = c2 as VisitDetail;
        return vd1.CodesetId === vd2.CodesetId;
      } else if (c1.hasOwnProperty('PayerPlanPeriod') && c2.hasOwnProperty('PayerPlanPeriod')) {
        const p1 = c1 as PayerPlanPeriod;
        const p2 = c2 as PayerPlanPeriod;
        return p1.PayerConcept === p2.PayerConcept &&
               p1.PayerSourceConcept === p2.PayerSourceConcept &&
               p1.PlanConcept === p2.PlanConcept &&
               p1.PlanSourceConcept === p2.PlanSourceConcept &&
               p1.SponsorConcept === p2.SponsorConcept &&
               p1.SponsorSourceConcept === p2.SponsorSourceConcept &&
               p1.StopReasonConcept === p2.StopReasonConcept &&
               p1.StopReasonSourceConcept === p2.StopReasonSourceConcept;
      }
      
      // 두 객체의 모든 키에 대해 깊은 동등성 체크
      return this.reflectionEquals(c1, c2);
    }
    
    return false;
  }
  
  private deepEquals(obj1: any, obj2: any): boolean {
    // 기본 타입과 null/undefined를 위한 체크
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    // 배열 비교
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEquals(obj1[i], obj2[i])) return false;
      }
      return true;
    }
    
    // 객체 비교
    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!this.deepEquals(obj1[key], obj2[key])) return false;
      }
      
      return true;
    }
    
    return obj1 === obj2;
  }
  
  private reflectionEquals(obj1: any, obj2: any): boolean {
    // 객체의 모든 속성을 비교하는 간단한 reflection 기반 equals
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    for (const key of keys1) {
      if (key === 'CorrelatedCriteria') continue; // 순환 참조 방지
      if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
  }
  
  protected checkCriteria(criteria: Criteria, groupName: string, reporter: WarningReporter): void {
    const criteriaName = CriteriaNameHelper.getCriteriaName(criteria) + " criteria in " + groupName;
    this.CriteriaList.push(new Pair<string, Criteria>(criteriaName, criteria));
  }
}