/*******************************************************************************
 * Copyright 2023 Observational Health Data Sciences and Informatics
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

// Main classes
export { CohortExpression, PrimaryCriteria } from './CohortExpression';
export { CohortExpressionQueryBuilder } from './CohortExpressionQueryBuilder';
export { ConceptSet } from './ConceptSet';
export { Criteria } from './Criteria';

// Interfaces
export { IGetCriteriaSqlDispatcher } from './IGetCriteriaSqlDispatcher';
export { IGetEndStrategySqlDispatcher } from './IGetEndStrategySqlDispatcher';

// Export all builders
export * from './builders';

// Export negative controls and print friendly are stubbed out since they're not implemented yet
// These are placeholders that should be implemented in the future

// Placeholder for negative controls
export namespace negativecontrols {
  export class CohortExpressionQueryBuilder {}
  export class DomainConfiguration {}
  export enum OccurrenceType { AT_LEAST, AT_MOST, EXACTLY }
  export class OutcomeCohortExpression {}
}

// Placeholder for print friendly
export namespace printfriendly {
  export class MarkdownRender {}
}