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

import { CriteriaSqlBuilder } from './CriteriaSqlBuilder';
import { CriteriaColumn } from './BuilderOptions';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { LocationRegion } from '../CohortExpression';
import { BuilderUtils } from './BuilderUtils';

/**
 * SQL builder for location region criteria
 */
export class LocationRegionSqlBuilder<T extends LocationRegion> extends CriteriaSqlBuilder<T> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);

  /**
   * Gets default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }

  /**
   * Gets the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/locationRegion.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.region_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Location Region: ${column}`);
    }
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: T): string {
    // Use only PascalCase
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : null;

    return query.replace("@codesetClause", 
      BuilderUtils.getCodesetJoinExpression(
        "l.region_concept_id",
        codesetId
      )
    );
  }

  /**
   * Embeds ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: T, whereClauses: string[]): string {
    // LocationRegion doesn't need ordinal expression
    return query;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: T): string[] {
    // LocationRegion doesn't need additional join clauses
    return [];
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: T): string[] {
    // LocationRegion doesn't need additional where clauses
    return [];
  }
}

export default LocationRegionSqlBuilder;