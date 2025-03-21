type StringWithOperator =
  | string
  | StringOperator
  | LogicalOperator<StringWithOperator>;
