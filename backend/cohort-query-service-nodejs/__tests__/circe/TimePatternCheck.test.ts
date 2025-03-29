import { TimePatternCheck } from '../../src/circe/check/checkers/TimePatternCheck';
import { CohortExpression, CorelatedCriteria, NumericRange, Window, ConditionOccurrence, CriteriaGroup, Criteria, WindowedCriteria } from '../../src/circe/cohortdefinition/CohortExpression';
import { Warning } from '../../src/circe/check/warnings/Warning';

// 테스트에 필요한 fixture 데이터 생성
function createCorrectExpression(): CohortExpression {
  const expression = new CohortExpression();
  
  // 기본적인 primary criteria 설정
  const conditionOccurrence = new ConditionOccurrence();
  conditionOccurrence.CodesetId = 0;
  
  expression.PrimaryCriteria = {
    CriteriaList: [conditionOccurrence],
    ObservationWindow: null,
    PrimaryCriteriaLimit: { Type: 0, Count: 0 } // 0 = All
  };
  
  // 올바른 시간 패턴을 가진 inclusion rule
  const criteriaGroup = new CriteriaGroup();
  criteriaGroup.Type = "ALL";
  criteriaGroup.CriteriaList = [];
  criteriaGroup.DemographicCriteriaList = [];
  criteriaGroup.Groups = [];
  criteriaGroup.Count = 0;
  
  expression.InclusionRules = [
    {
      Name: "올바른 시간 패턴 규칙",
      Description: "Event A -> Event B (올바른 순서)",
      Expression: criteriaGroup
    }
  ];
  
  // 첫 번째 이벤트 (Event A)
  const firstCriteria = new CorelatedCriteria();
  firstCriteria.Criteria = new ConditionOccurrence();
  (firstCriteria.Criteria as ConditionOccurrence).CodesetId = 1;
  firstCriteria.StartWindow = new Window();
  firstCriteria.StartWindow.Start = new NumericRange();
  firstCriteria.StartWindow.Start.Value = -30; // 과거 30일
  firstCriteria.StartWindow.Start.Op = "lte";
  firstCriteria.StartWindow.End = new NumericRange();
  firstCriteria.StartWindow.End.Value = -1; // 과거 1일
  firstCriteria.StartWindow.End.Op = "gte";
  
  // 두 번째 이벤트 (Event B)
  const secondCriteria = new CorelatedCriteria();
  secondCriteria.Criteria = new ConditionOccurrence();
  (secondCriteria.Criteria as ConditionOccurrence).CodesetId = 2;
  secondCriteria.StartWindow = new Window();
  secondCriteria.StartWindow.Start = new NumericRange();
  secondCriteria.StartWindow.Start.Value = 1; // 미래 1일
  secondCriteria.StartWindow.Start.Op = "lte";
  secondCriteria.StartWindow.End = new NumericRange();
  secondCriteria.StartWindow.End.Value = 30; // 미래 30일
  secondCriteria.StartWindow.End.Op = "gte";
  
  // CorelatedCriteria 대신 WindowedCriteria로 변환하여 추가
  const windowedFirst = new WindowedCriteria();
  windowedFirst.Criteria = firstCriteria.Criteria;
  windowedFirst.Window = firstCriteria.StartWindow;
  
  const windowedSecond = new WindowedCriteria();
  windowedSecond.Criteria = secondCriteria.Criteria;
  windowedSecond.Window = secondCriteria.StartWindow;
  
  // Inclusion rule에 criteria 추가
  expression.InclusionRules[0].Expression.CriteriaList = [
    windowedFirst, windowedSecond
  ];
  
  return expression;
}

function createIncorrectExpression(): CohortExpression {
  const expression = new CohortExpression();
  
  // 기본적인 primary criteria 설정
  const conditionOccurrence = new ConditionOccurrence();
  conditionOccurrence.CodesetId = 0;
  
  expression.PrimaryCriteria = {
    CriteriaList: [conditionOccurrence],
    ObservationWindow: null,
    PrimaryCriteriaLimit: { Type: 0, Count: 0 } // 0 = All
  };
  
  // 잘못된 시간 패턴을 가진 inclusion rule
  const criteriaGroup = new CriteriaGroup();
  criteriaGroup.Type = "ALL";
  criteriaGroup.CriteriaList = [];
  criteriaGroup.DemographicCriteriaList = [];
  criteriaGroup.Groups = [];
  criteriaGroup.Count = 0;
  
  expression.InclusionRules = [
    {
      Name: "잘못된 시간 패턴 규칙",
      Description: "Event B -> Event A (잘못된 순서)",
      Expression: criteriaGroup
    }
  ];
  
  // 첫 번째 이벤트 - 시간 순서가 잘못됨 (미래에 있어야 할 이벤트)
  const firstCriteria = new CorelatedCriteria();
  firstCriteria.Criteria = new ConditionOccurrence();
  (firstCriteria.Criteria as ConditionOccurrence).CodesetId = 1;
  firstCriteria.StartWindow = new Window();
  firstCriteria.StartWindow.Start = new NumericRange();
  firstCriteria.StartWindow.Start.Value = 10; // 미래 10일
  firstCriteria.StartWindow.Start.Op = "lte";
  firstCriteria.StartWindow.End = new NumericRange();
  firstCriteria.StartWindow.End.Value = 30; // 미래 30일
  firstCriteria.StartWindow.End.Op = "gte";
  
  // 두 번째 이벤트 - 시간 순서가 잘못됨 (과거에 있어야 할 이벤트)
  const secondCriteria = new CorelatedCriteria();
  secondCriteria.Criteria = new ConditionOccurrence(); 
  (secondCriteria.Criteria as ConditionOccurrence).CodesetId = 2;
  secondCriteria.StartWindow = new Window();
  secondCriteria.StartWindow.Start = new NumericRange();
  secondCriteria.StartWindow.Start.Value = -30; // 과거 30일
  secondCriteria.StartWindow.Start.Op = "lte";
  secondCriteria.StartWindow.End = new NumericRange();
  secondCriteria.StartWindow.End.Value = -10; // 과거 10일
  secondCriteria.StartWindow.End.Op = "gte";
  
  // 잘못된 겹치는 시간 패턴
  const thirdCriteria = new CorelatedCriteria();
  thirdCriteria.Criteria = new ConditionOccurrence();
  (thirdCriteria.Criteria as ConditionOccurrence).CodesetId = 3;
  thirdCriteria.StartWindow = new Window();
  thirdCriteria.StartWindow.Start = new NumericRange();
  thirdCriteria.StartWindow.Start.Value = -5; // 과거 5일
  thirdCriteria.StartWindow.Start.Op = "lte";
  thirdCriteria.StartWindow.End = new NumericRange();
  thirdCriteria.StartWindow.End.Value = 5; // 미래 5일
  thirdCriteria.StartWindow.End.Op = "gte";
  
  // CorelatedCriteria 대신 WindowedCriteria로 변환하여 추가
  const windowedFirst = new WindowedCriteria();
  windowedFirst.Criteria = firstCriteria.Criteria;
  windowedFirst.Window = firstCriteria.StartWindow;
  
  const windowedSecond = new WindowedCriteria();
  windowedSecond.Criteria = secondCriteria.Criteria;
  windowedSecond.Window = secondCriteria.StartWindow;
  
  const windowedThird = new WindowedCriteria();
  windowedThird.Criteria = thirdCriteria.Criteria;
  windowedThird.Window = thirdCriteria.StartWindow;
  
  // Inclusion rule에 criteria 추가
  expression.InclusionRules[0].Expression.CriteriaList = [
    windowedFirst, windowedSecond, windowedThird
  ];
  
  return expression;
}

describe('TimePatternCheck', () => {
  let timePatternCheck: TimePatternCheck;
  
  beforeEach(() => {
    timePatternCheck = new TimePatternCheck();
  });
  
  test('should not report warnings for correct time patterns', () => {
    const expression = createCorrectExpression();
    
    const warnings: Warning[] = timePatternCheck.check(expression);
    
    // 올바른 시간 패턴이므로 경고가 없어야 함
    expect(warnings.length).toBe(0);
  });
  
  test('should report warnings for incorrect time patterns', () => {
    const expression = createIncorrectExpression();
    
    const warnings: Warning[] = timePatternCheck.check(expression);
    
    // 잘못된 시간 패턴이 있어야 함 (현재 구현에서는 2개가 생성됨)
    expect(warnings.length).toBe(2);
    
    // 경고 메시지에 "time window" 또는 "order" 단어가 포함되어야 함
    warnings.forEach(warning => {
      const lowerMessage = warning.Message.toLowerCase();
      expect(lowerMessage.includes("time window") || lowerMessage.includes("order")).toBeTruthy();
    });
  });
  
  test('should handle expressions without inclusion rules', () => {
    const expression = new CohortExpression();
    
    const conditionOccurrence = new ConditionOccurrence();
    conditionOccurrence.CodesetId = 0;
    
    expression.PrimaryCriteria = {
      CriteriaList: [conditionOccurrence],
      ObservationWindow: null,
      PrimaryCriteriaLimit: { Type: 0, Count: 0 } // 0 = All
    };
    
    expression.InclusionRules = []; // 빈 inclusion rules
    
    const warnings: Warning[] = timePatternCheck.check(expression);
    
    // inclusion rule이 없으므로 경고가 없어야 함
    expect(warnings.length).toBe(0);
  });
});