/*******************************************************************************
 * Copyright 2025 Observational Health Data Sciences and Informatics
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Authors: Christopher Knoll, Gowtham Rao
 ******************************************************************************/

/**
 * Base interface for all criteria objects
 */
export interface ICriteria {
  CriteriaType?: string;
  CriteriaName?: string; // Made optional to be compatible with existing classes
  Domain?: string;
  CodesetId?: number;
  // Add source concept properties for all criteria types
  DeviceSourceConcept?: number;
  DrugSourceConcept?: number;
  MeasurementSourceConcept?: number;
  ObservationSourceConcept?: number;
  ProcedureSourceConcept?: number;
  SpecimenSourceConcept?: number;
  VisitDetailSourceConcept?: number;
  ConditionSourceConcept?: number;
  VisitSourceConcept?: number;
  // First property for history checks
  First?: boolean;
  // Properties for ranges
  EraStartDate?: any;
  EraEndDate?: any;
  VisitDetailStartDate?: any;
  VisitDetailEndDate?: any;
  VisitDetailLength?: number;
  PeriodLength?: number | INumericRange; // Allow for both number and NumericRange
  RangeLow?: number;
  RangeHigh?: number;
  RangeLowRatio?: number;
  RangeHighRatio?: number;
  StartDate?: any;
  EndDate?: any;
  SourceId?: string;
  // Properties for CriteriaCheckerFactory and ConceptSetSelectionCheckerFactory
  VisitDetailTypeCS?: ConceptSetSelection;
  GenderCS?: ConceptSetSelection;
  ProviderSpecialtyCS?: ConceptSetSelection;
  PlaceOfServiceCS?: ConceptSetSelection;
  // Add the CorrelatedCriteria property that some code expects
  CorrelatedCriteria?: any;
  // Add property expected by NoExitCriteriaCheck
  Type?: string | number;
  Criteria?: ICriteria;
}

/**
 * Interface for correlated criteria
 */
export interface ICorelatedCriteria {
  Criteria?: ICriteria;
  StartWindow?: IWindow;
  EndWindow?: IWindow;
  Occurrence?: IOccurrence;
  RestrictVisit?: boolean;
}

/**
 * Interface for windowed criteria
 */
export interface IWindowedCriteria {
  Criteria?: ICriteria;
  Window?: IWindow;
}

/**
 * Interface for criteria groups
 */
export interface ICriteriaGroup {
  Type: string;
  CriteriaList: (ICriteria | IWindowedCriteria)[];
  DemographicCriteriaList: IDemographicCriteria[];
  Groups: ICriteriaGroup[];
  Count: number;
  isEmpty(): boolean;
}

/**
 * Interface for demographic criteria
 */
export interface IDemographicCriteria extends ICriteria {
  Age?: INumericRange;
  Gender?: number[];
  GenderExclude?: boolean;
  Race?: number[];
  RaceExclude?: boolean;
  Ethnicity?: number[];
  EthnicityExclude?: boolean;
}

/**
 * Interface for windows
 */
export interface IWindow {
  Start: INumericRange | null;
  End: INumericRange | null;
  UseIndexEnd: boolean;
  UseEventEnd: boolean;
}

/**
 * Interface for numeric ranges
 */
export interface INumericRange {
  Value: number;
  Op: string;
  Extent?: number;
  // Add these properties for compatibility with old code that expects them
  Days?: number;
  Coeff?: number;
}

/**
 * Interface for date ranges
 */
export interface IDateRange {
  StartDate?: Date;
  EndDate?: Date;
  // Add these for compatibility with old code that uses value/extent
  Value?: string | Date;
  Extent?: string | Date;
}

/**
 * Interface for occurrences
 */
export interface IOccurrence {
  Type: number;
  Count: number;
  IsDistinct: boolean;
}

/**
 * Interface for observation filters
 */
export interface IObservationFilter {
  ObservationTypeExclude: boolean;
  ObservationType: number[];
  // Add these for compatibility with old code
  PriorDays?: number;
  PostDays?: number;
}

/**
 * Interface for a window endpoint
 */
export interface IWindowEndpoint {
  Value?: number;
  Op?: string;
  Days?: number;
  Coeff?: number;
}

/**
 * Interface for concept set selection
 */
export interface ConceptSetSelection {
  Min?: number;
  Max?: number;
  CodesetId?: number;
}