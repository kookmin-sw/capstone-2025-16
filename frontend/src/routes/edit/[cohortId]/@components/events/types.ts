interface Operator<T> {
    eq?: T;
    gt?: T;
    gte?: T;
    lt?: T;
    lte?: T;
  }
  
  interface LogicalOperator<T> {
    and?: T[];
    or?: T[];
  }
  
  type NumberWithOperator =
    | number
    | Operator<number>
    | LogicalOperator<NumberWithOperator>;
  type NumberArrayWithOperator = number[] | LogicalOperator<NumberWithOperator>;
  type DateWithOperator =
    | string
    | Operator<string>
    | LogicalOperator<DateWithOperator>;
  
  type Criteria =
    | {
        [K in keyof CriteriaFilterMap]: {
          type: K;
          filters: CriteriaFilterMap[K];
        };
      }[keyof CriteriaFilterMap][]
    | LogicalOperator<Criteria>;
  
  interface Cohort {
    entry: Criteria;
    inclusion?: Criteria;
    exit?: Criteria;
  }
  
  interface CriteriaFilterMap {
    condition_era: ConditionEraFilter;
    condition_occurrence: ConditionOccurrenceFilter;
  }
  
  interface ConditionEraFilter {
    firstDiagnosis?: boolean;
    eraStartAge?: NumberWithOperator;
    eraEndAge?: NumberWithOperator;
    gender?: NumberArrayWithOperator;
    startDate?: DateWithOperator;
    endDate?: DateWithOperator;
    eraConditionCount?: NumberWithOperator;
    eraLength?: NumberWithOperator;
  }
  
  interface ConditionOccurrenceFilter {
    firstDiagnosis?: boolean;
  }