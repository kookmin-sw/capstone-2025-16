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

import { 
  Criteria, 
  DemographicCriteria, 
  NumericRange, 
  DateRange, 
  Period, 
  Window, 
  CohortExpression,
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
  PayerPlanPeriod,
  ProcedureOccurrence,
  Specimen,
  VisitOccurrence,
  VisitDetail,
  LocationRegion
} from '../../cohortdefinition/CohortExpression';
import { BaseCheckerFactory } from './BaseCheckerFactory';
import { WarningReporter } from './WarningReporter';
import { Operations } from '../operations/Operations';
import { Comparisons } from './Comparisons';
import { Constants } from '../Constants';

export class RangeCheckerFactory extends BaseCheckerFactory {
  private static readonly WARNING_EMPTY_START_VALUE = "%s in the %s has empty %s start value";
  private static readonly WARNING_EMPTY_END_VALUE = "%s in the %s has empty %s end value";
  private static readonly WARNING_START_GREATER_THAN_END = "%s in the %s has start value greater than end in %s";
  private static readonly WARNING_START_IS_NEGATIVE = "%s in the %s start value is negative at %s";
  private static readonly WARNING_DATE_IS_INVALID = "%s in the %s has invalid date value at %s";
  private static readonly ROOT_OBJECT = "root object";

  private constructor(reporter: WarningReporter, groupName: string) {
    super(reporter, groupName);
  }

  public static getFactory(reporter: WarningReporter, groupName: string): RangeCheckerFactory {
    return new RangeCheckerFactory(reporter, groupName);
  }

  protected getCheck(criteria: Criteria): (criteria: Criteria) => void {
    if (criteria instanceof ConditionEra) {
      return (c: Criteria) => {
        const conditionEra = c as ConditionEra;
        this.checkRange(conditionEra.AgeAtStart, Constants.Criteria.CONDITION_ERA, Constants.Attributes.AGE_AT_ERA_START_ATTR);
        this.checkRange(conditionEra.AgeAtEnd, Constants.Criteria.CONDITION_ERA, Constants.Attributes.AGE_AT_ERA_END_ATTR);
        this.checkRange(conditionEra.EraLength, Constants.Criteria.CONDITION_ERA, Constants.Attributes.ERA_LENGTH_ATTR);
        this.checkRange(conditionEra.OccurrenceCount, Constants.Criteria.CONDITION_ERA, Constants.Attributes.OCCURRENCE_COUNT_ATTR);
        this.checkRange(conditionEra.EraStartDate, Constants.Criteria.CONDITION_ERA, Constants.Attributes.ERA_START_DATE_ATTR);
        this.checkRange(conditionEra.EraEndDate, Constants.Criteria.CONDITION_ERA, Constants.Attributes.ERA_END_DATE_ATTR);
      };
    } else if (criteria instanceof ConditionOccurrence) {
      return (c: Criteria) => {
        const co = c as ConditionOccurrence;
        this.checkRange(co.OccurrenceStartDate, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(co.OccurrenceEndDate, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.OCCURRENCE_END_DATE_ATTR);
        this.checkRange(co.Age, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof Death) {
      return (c: Criteria) => {
        const death = c as Death;
        this.checkRange(death.Age, Constants.Criteria.DEATH, Constants.Attributes.AGE_ATTR);
        this.checkRange(death.OccurrenceStartDate, Constants.Criteria.DEATH, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
      };
    } else if (criteria instanceof DeviceExposure) {
      return (c: Criteria) => {
        const de = c as DeviceExposure;
        this.checkRange(de.OccurrenceStartDate, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(de.OccurrenceEndDate, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.OCCURRENCE_END_DATE_ATTR);
        this.checkRange(de.Quantity, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.QUANTITY_ATTR);
        this.checkRange(de.Age, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof DoseEra) {
      return (c: Criteria) => {
        const doseEra = c as DoseEra;
        this.checkRange(doseEra.EraStartDate, Constants.Criteria.DOSE_ERA, Constants.Attributes.ERA_START_DATE_ATTR);
        this.checkRange(doseEra.EraEndDate, Constants.Criteria.DOSE_ERA, Constants.Attributes.ERA_END_DATE_ATTR);
        this.checkRange(doseEra.DoseValue, Constants.Criteria.DOSE_ERA, Constants.Attributes.DOSE_VALUE_ATTR);
        this.checkRange(doseEra.EraLength, Constants.Criteria.DOSE_ERA, Constants.Attributes.ERA_LENGTH_ATTR);
        this.checkRange(doseEra.AgeAtStart, Constants.Criteria.DOSE_ERA, Constants.Attributes.AGE_AT_START_ATTR);
        this.checkRange(doseEra.AgeAtEnd, Constants.Criteria.DOSE_ERA, Constants.Attributes.AGE_AT_END_ATTR);
      };
    } else if (criteria instanceof DrugEra) {
      return (c: Criteria) => {
        const drugEra = c as DrugEra;
        this.checkRange(drugEra.EraStartDate, Constants.Criteria.DRUG_ERA, Constants.Attributes.ERA_START_DATE_ATTR);
        this.checkRange(drugEra.EraEndDate, Constants.Criteria.DRUG_ERA, Constants.Attributes.ERA_END_DATE_ATTR);
        this.checkRange(drugEra.OccurrenceCount, Constants.Criteria.DRUG_ERA, Constants.Attributes.OCCURRENCE_COUNT_ATTR);
        this.checkRange(drugEra.GapDays, Constants.Criteria.DRUG_ERA, Constants.Attributes.GAP_DAYS_ATTR);
        this.checkRange(drugEra.EraLength, Constants.Criteria.DRUG_ERA, Constants.Attributes.ERA_LENGTH_ATTR);
        this.checkRange(drugEra.AgeAtStart, Constants.Criteria.DRUG_ERA, Constants.Attributes.AGE_AT_START_ATTR);
        this.checkRange(drugEra.AgeAtEnd, Constants.Criteria.DRUG_ERA, Constants.Attributes.AGE_AT_END_ATTR);
      };
    } else if (criteria instanceof DrugExposure) {
      return (c: Criteria) => {
        const de = c as DrugExposure;
        this.checkRange(de.OccurrenceStartDate, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(de.OccurrenceEndDate, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.OCCURRENCE_END_DATE_ATTR);
        this.checkRange(de.Refills, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.REFILLS_ATTR);
        this.checkRange(de.Quantity, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.QUANTITY_ATTR);
        this.checkRange(de.DaysSupply, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.DAYS_SUPPLY_ATTR);
        this.checkRange(de.EffectiveDrugDose, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.EFFECTIVE_DRUG_DOSE_ATTR);
        this.checkRange(de.Age, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof Measurement) {
      return (c: Criteria) => {
        const m = c as Measurement;
        this.checkRange(m.OccurrenceStartDate, Constants.Criteria.MEASUREMENT, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(m.ValueAsNumber, Constants.Criteria.MEASUREMENT, Constants.Attributes.VALUE_AS_NUMBER_ATTR);
        this.checkRange(m.RangeLow, Constants.Criteria.MEASUREMENT, Constants.Attributes.RANGE_LOW_ATTR);
        this.checkRange(m.RangeHigh, Constants.Criteria.MEASUREMENT, Constants.Attributes.RANGE_HIGH_ATTR);
        this.checkRange(m.RangeLowRatio, Constants.Criteria.MEASUREMENT, Constants.Attributes.RANGE_LOW_RATIO_ATTR);
        this.checkRange(m.RangeHighRatio, Constants.Criteria.MEASUREMENT, Constants.Attributes.RANGE_HIGH_RATIO_ATTR);
        this.checkRange(m.Age, Constants.Criteria.MEASUREMENT, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof Observation) {
      return (c: Criteria) => {
        const o = c as Observation;
        this.checkRange(o.OccurrenceStartDate, Constants.Criteria.OBSERVATION, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(o.ValueAsNumber, Constants.Criteria.OBSERVATION, Constants.Attributes.VALUE_AS_NUMBER_ATTR);
        this.checkRange(o.Age, Constants.Criteria.OBSERVATION, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof ObservationPeriod) {
      return (c: Criteria) => {
        const op = c as ObservationPeriod;
        this.checkRange(op.PeriodStartDate, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.PERIOD_START_DATE_ATTR);
        this.checkRange(op.PeriodEndDate, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.PERIOD_END_DATE_ATTR);
        this.checkRange(op.PeriodLength, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.PERIOD_LENGTH_ATTR);
        this.checkRange(op.AgeAtStart, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.AGE_AT_START_ATTR);
        this.checkRange(op.AgeAtEnd, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.AGE_AT_END_ATTR);
      };
    } else if (criteria instanceof ProcedureOccurrence) {
      return (c: Criteria) => {
        const po = c as ProcedureOccurrence;
        this.checkRange(po.OccurrenceStartDate, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(po.Quantity, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.QUANTITY_ATTR);
        this.checkRange(po.Age, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof Specimen) {
      return (c: Criteria) => {
        const specimen = c as Specimen;
        this.checkRange(specimen.OccurrenceStartDate, Constants.Criteria.SPECIMEN, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(specimen.Quantity, Constants.Criteria.SPECIMEN, Constants.Attributes.QUANTITY_ATTR);
        this.checkRange(specimen.Age, Constants.Criteria.SPECIMEN, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof VisitOccurrence) {
      return (c: Criteria) => {
        const vo = c as VisitOccurrence;
        this.checkRange(vo.OccurrenceStartDate, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
        this.checkRange(vo.OccurrenceEndDate, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.OCCURRENCE_END_DATE_ATTR);
        this.checkRange(vo.VisitLength, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.VISIT_LENGTH_ATTR);
        this.checkRange(vo.Age, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof VisitDetail) {
      return (c: Criteria) => {
        const vd = c as VisitDetail;
        this.checkRange(vd.VisitDetailStartDate, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.VISIT_DETAIL_START_DATE_ATTR);
        this.checkRange(vd.VisitDetailEndDate, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.VISIT_DETAIL_END_DATE_ATTR);
        this.checkRange(vd.VisitDetailLength, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.VISIT_DETAIL_LENGTH_ATTR);
        this.checkRange(vd.Age, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.AGE_ATTR);
      };
    } else if (criteria instanceof PayerPlanPeriod) {
      return (c: Criteria) => {
        const planPeriod = c as PayerPlanPeriod;
        this.checkRange(planPeriod.PeriodStartDate, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.PERIOD_START_DATE_ATTR);
        this.checkRange(planPeriod.PeriodEndDate, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.PERIOD_END_DATE_ATTR);
        this.checkRange(planPeriod.PeriodLength, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.PERIOD_LENGTH_ATTR);
        this.checkRange(planPeriod.AgeAtStart, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.AGE_AT_START_ATTR);
        this.checkRange(planPeriod.AgeAtEnd, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.AGE_AT_END_ATTR);
      };
    } else if (criteria instanceof LocationRegion) {
      return (c: Criteria) => {
        const region = c as LocationRegion;
        this.checkRange(region.StartDate, Constants.Criteria.LOCATION_REGION, Constants.Attributes.LOCATION_REGION_START_DATE_ATTR);
        this.checkRange(region.EndDate, Constants.Criteria.LOCATION_REGION, Constants.Attributes.LOCATION_REGION_END_DATE_ATTR);
      };
    }
    
    return () => {}; // Default no-op function
  }

  protected getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void {
    return (c: DemographicCriteria) => {
      this.checkRange(c.OccurrenceEndDate, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.OCCURRENCE_END_DATE_ATTR);
      this.checkRange(c.OccurrenceStartDate, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.OCCURRENCE_START_DATE_ATTR);
      this.checkRange(c.Age, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.AGE_ATTR);
    };
  }

  private checkNumericRange(range: NumericRange | undefined, criteriaName: string, attribute: string): void {
    if (!range) return;
    
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    Operations.match<NumericRange, void>(range)
      .when(r => r.Op?.endsWith("bt"))
      .then(r => {
        Operations.match<NumericRange, void>(r)
          .when(x => x.Value === undefined || x.Value === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_START_VALUE))
          .when(x => x.Extent === undefined || x.Extent === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_END_VALUE))
          .when(Comparisons.startIsGreaterThanEnd)
          .then(() => warning(RangeCheckerFactory.WARNING_START_GREATER_THAN_END));
      })
      .orElse(r => 
        Operations.match<NumericRange, void>(r)
          .when(Comparisons.isStartNegative)
          .then(() => warning(RangeCheckerFactory.WARNING_START_IS_NEGATIVE))
          .when(x => x.Value === undefined || x.Value === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_START_VALUE)));
  }

  private checkDateRange(range: DateRange | undefined, criteriaName: string, attribute: string): void {
    if (!range) return;
    
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    Operations.match<DateRange, void>(range)
      .when(r => r.Value !== undefined && r.Value !== null && !Comparisons.isDateValid(r.Value as string))
      .then(() => warning(RangeCheckerFactory.WARNING_DATE_IS_INVALID))
      .when(r => r.Op?.endsWith("bt"))
      .then(r => {
        Operations.match<DateRange, void>(r)
          .when(x => x.Value === undefined || x.Value === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_START_VALUE))
          .when(x => x.Extent === undefined || x.Extent === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_END_VALUE))
          .when(x => x.Extent !== undefined && x.Extent !== null && !Comparisons.isDateValid(x.Extent as string))
          .then(() => warning(RangeCheckerFactory.WARNING_DATE_IS_INVALID))
          .when(Comparisons.startIsGreaterThanEnd)
          .then(() => warning(RangeCheckerFactory.WARNING_START_GREATER_THAN_END));
      })
      .orElse(r => 
        Operations.match<DateRange, void>(r)
          .when(x => x.Value === undefined || x.Value === null)
          .then(() => warning(RangeCheckerFactory.WARNING_EMPTY_START_VALUE)));
  }
  
  // Type guard helper methods
  private isNumericRange(range: any): range is NumericRange {
    return range && range instanceof NumericRange;
  }
  
  private isDateRange(range: any): range is DateRange {
    return range && range instanceof DateRange;
  }
  
  // Common entry point for ranges
  private checkAnyRange(range: any, criteriaName: string, attribute: string): void {
    if (!range) return;
    
    if (this.isNumericRange(range)) {
      this.checkNumericRange(range, criteriaName, attribute);
    } else if (this.isDateRange(range)) {
      this.checkDateRange(range, criteriaName, attribute);
    } else if (range instanceof Period) {
      this.checkPeriodRange(range, criteriaName, attribute);
    }
  }

  private checkPeriodRange(period: Period | undefined, criteriaName: string, attribute: string): void {
    if (!period) return;
    
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    Operations.match<Period, void>(period)
      .when(x => x.StartDate !== undefined && x.StartDate !== null && !Comparisons.isDateValid(x.StartDate as unknown as string))
      .then(() => warning(RangeCheckerFactory.WARNING_DATE_IS_INVALID))
      .when(x => x.EndDate !== undefined && x.EndDate !== null && !Comparisons.isDateValid(x.EndDate as unknown as string))
      .then(() => warning(RangeCheckerFactory.WARNING_DATE_IS_INVALID))
      .when(Comparisons.startIsGreaterThanEnd)
      .then(() => warning(RangeCheckerFactory.WARNING_START_GREATER_THAN_END));
  }
  
  // Public method that routes to the appropriate type-specific check
  public checkRange(range: any, criteriaName: string, attribute: string): void {
    this.checkAnyRange(range, criteriaName, attribute);
  }

  public check(object: any, criteriaName?: string, attribute?: string): void {
    if (!object) return;
    
    if (object instanceof CohortExpression) {
      // Original functionality
      this.checkRange(object.CensorWindow, RangeCheckerFactory.ROOT_OBJECT, Constants.Attributes.CENSOR_WINDOW_ATTR);
    } else if (object instanceof Window) {
      // Allow checking individual Window objects
      this.checkWindowRange(object, criteriaName || RangeCheckerFactory.ROOT_OBJECT, attribute || "window");
    } else if (object instanceof NumericRange) {
      // Allow checking individual NumericRange objects
      this.checkRange(object, criteriaName || RangeCheckerFactory.ROOT_OBJECT, attribute || "range");
    } else if (object instanceof DateRange) {
      // Allow checking individual DateRange objects
      this.checkRange(object, criteriaName || RangeCheckerFactory.ROOT_OBJECT, attribute || "date range");
    }
  }
  
  // New helper method to check Window objects
  private checkWindowRange(window: Window, criteriaName: string, attribute: string): void {
    if (window.Start) {
      this.checkRange(window.Start, criteriaName, attribute + ".Start");
    }
    if (window.End) {
      this.checkRange(window.End, criteriaName, attribute + ".End");
    }
  }
}