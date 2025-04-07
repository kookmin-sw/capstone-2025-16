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

// Export cohort definition components
export * from './cohortdefinition';

// Export helper stub
export namespace helper {
  export class ResourceHelper {
    static GetResourceAsString(resourcePath: string): string {
      // This is a stub - it should read the actual SQL resources
      // For now just return a placeholder SQL template
      return "-- Placeholder SQL for " + resourcePath;
    }
  }
}

// Export vocabulary stub
export namespace vocabulary {
  export class ConceptSetExpressionQueryBuilder {
    static buildExpressionQuery(expression: any): string {
      return "";
    }
  }
}

// Export check components stub
export namespace check {
  export class Checker {
    static check(expression: any): any[] {
      return [];
    }
  }
  
  export class Warning {
    constructor(public Message: string, public Type: string) {}
  }
}