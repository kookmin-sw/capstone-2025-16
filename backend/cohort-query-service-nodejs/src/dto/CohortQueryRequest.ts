export class CohortQueryRequest {
  // Required parameters
  expression: string = '';
  cdmSchema: string = '';
  
  // Schema and database parameters
  vocabularySchema?: string;
  targetDatabaseSchema?: string;
  targetCohortTable?: string;
  resultsDatabaseSchema?: string;
  
  // Cohort parameters
  cohortId: number = 0;
  cohortIdFieldName?: string;
  
  // Generation options
  generateStats: boolean = false;
  eraConstructorPad?: number;
  ruleTotal?: number;
  
  // SQL rendering parameters
  targetDialect?: string;
  sessionId?: string;
  oracleTempSchema?: string;
  parameterNames?: string[];
  parameterValues?: string[];
  
  // Analysis related parameters
  inclusionImpactMode?: number;
  
  // Query performance related parameters
  useEraConstructor?: boolean;
}

export default CohortQueryRequest;