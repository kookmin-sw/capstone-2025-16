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
 ******************************************************************************/

// This file contains interfaces for domain-specific nested criteria properties
// to help with type safety when accessing nested properties
import { Criteria } from './CohortExpression';
export { Criteria };

export interface ConditionEraProperties {
  CodesetId?: number;
  First?: boolean;
  OccurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  EraLength?: any;
  OccurrenceCount?: any;
}

export interface ConditionOccurrenceProperties {
  CodesetId?: number;
  First?: boolean;
  OccurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  ConditionType?: number[];
  ConditionTypeExclude?: boolean;
  ConditionStatus?: number[];
  ConditionStatusExclude?: boolean;
  StopReason?: any;
}

export interface DrugExposureProperties {
  CodesetId?: number;
  First?: boolean;
  OccurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  DrugType?: number[];
  DrugTypeExclude?: boolean;
  StopReason?: any;
  Refills?: any;
  DaysSupply?: any;
  RouteExclude?: boolean;
  Route?: number[];
}

export interface DrugEraProperties {
  CodesetId?: number;
  First?: boolean;
  OccurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  EraLength?: any;
  OccurrenceCount?: any;
  GapDays?: any;
}