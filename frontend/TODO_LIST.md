# Atlas 코호트 빌더 구현 TODO 리스트

현재 구현된 코호트 빌더(`/new` 페이지)에서 Atlas 원본 기능과 비교하여 아직 구현되지 않은 기능들의 목록입니다. 이 문서는 개발팀이 향후 구현해야 할 기능들의 우선순위와 복잡도를 파악하는 데 도움이 될 것입니다.

## 구현 현황

### 1단계: 코어 데이터 구조 완성 ✅
**완료 내용**: 
- Atlas의 데이터 모델과 일치하는 모든 데이터 구조 구현
- 각 이벤트 유형의 완전한 속성 집합 구현
- 계층적 데이터 구조의 올바른 중첩 구현

**구현 파일**:
- `/src/routes/new/models/ConceptSet.js`
- `/src/routes/new/models/CriteriaGroup.js`
- `/src/routes/new/models/WindowedCriteria.js`
- `/src/routes/new/models/Criteria.js`
- `/src/routes/new/models/DemographicCriteria.js`
- `/src/routes/new/models/EndStrategy.js`
- `/src/routes/new/models/InclusionRule.js`
- `/src/routes/new/models/CohortExpression.js`
- `/src/routes/new/models/index.js`

## 주요 미구현 기능

### 1. 개념 집합(Concept Set) 관리 - 우선순위: 높음, 복잡도: 높음
- [x] 개념 집합 생성 및 관리 UI
- [x] 개념 검색 기능
- [x] 개념 집합 가져오기/내보내기 UI
- [ ] 개념 계층 구조 탐색
- [x] 개념 속성 편집(포함/제외 조건) UI
- [x] 개념 집합을 코호트 정의에 연결하는 메커니즘 개선

**구현 상태**:
- ✅ 개념 집합 데이터 모델 구현 완료
- ✅ 개념 집합 항목 관리를 위한 기본 함수 구현 (추가, 제거, 속성 업데이트)
- ✅ JSON 가져오기/내보내기 함수 구현
- ✅ 기본적인 개념 집합-코호트 연결 가능(CodesetId)
- ✅ 개념 검색 및 관리 UI 구현 완료
- ✅ 개념 속성 편집 UI 구현 완료
- ✅ 개념 집합 관리 모달 컴포넌트 구현 완료
- ❌ 개념 계층 구조 탐색 기능 미구현 (실제 API 연동 필요)

### 2. 포함 규칙(Inclusion Rules) 구현 - 우선순위: 높음, 복잡도: 높음
- [x] 완전한 포함 규칙 편집기
- [x] CriteriaGroup 구조 지원
- [x] 논리 연산(ALL, ANY, AT_LEAST) 구현
- [x] 인구통계학 기준 목록 구현
- [x] 조건 그룹 중첩 지원
- [x] 복잡한 포함 규칙 표현 UI

**구현 상태**:
- ✅ 포함 규칙 데이터 모델 구현 완료
- ✅ 기본적인 포함 규칙 추가 기능 구현
- ✅ 포함 규칙 편집 UI 구현 완료
- ✅ 포함 규칙 모달 컴포넌트 구현 완료
- ✅ 논리 연산자 및 중첩 그룹 지원 구현
- ✅ 인구통계학 기준 목록 기초 구현 완료 (상세 속성 편집 UI는 향후 구현 필요)
- ✅ 시간 윈도우가 있는 조건 구현 완료

### 3. 추가 기준(Additional Criteria) 구현 - 우선순위: 중간, 복잡도: 중간
- [x] WindowedCriteria 구현
- [x] Occurrence 패턴 (정확히 X회, 최소 X회 등)
- [x] 조건 발생 시간 윈도우 설정

**구현 상태**:
- ✅ WindowedCriteria 데이터 모델 구현 완료
- ✅ Occurrence 패턴 데이터 모델 구현
- ✅ 포함 규칙 모달 내에서 WindowedCriteria 및 발생 패턴 UI 구현 완료
- ✅ 시간 윈도우 설정 UI 구현 완료

### 4. 종료 전략(End Strategy) 구현 - 우선순위: 중간, 복잡도: 중간
- [x] DateOffset 전략 구현
- [x] CustomEra 전략 구현
- [x] 종료 전략 UI 및 설정

**구현 상태**:
- ✅ 종료 전략 데이터 모델 구현 완료
- ✅ EndStrategyModal 컴포넌트 구현 완료
- ✅ DateOffset 전략 UI 구현 완료
- ✅ CustomEra 전략 UI 구현 완료

### 5. 검열 기준(Censoring Criteria) 구현 - 우선순위: 중간, 복잡도: 중간
- [ ] 검열 기준 편집기
- [ ] 검열 기준 목록 관리
- [ ] 검열 기준의 이벤트 타입 지원

**구현 상태**:
- ✅ 검열 기준 데이터 구조 구현
- ❌ UI 구현 미완료

### 6. 저장 및 불러오기 기능 - 우선순위: 높음, 복잡도: 중간
- [ ] 코호트 정의 저장 기능
- [ ] 코호트 정의 목록 보기
- [ ] 기존 코호트 정의 불러오기
- [ ] 코호트 복사 및 버전 관리

### 7. JSON 가져오기/내보내기 - 우선순위: 중간, 복잡도: 낮음
- [ ] 코호트 정의 JSON 가져오기 UI
- [ ] 코호트 정의 JSON 내보내기 UI
- [ ] JSON 유효성 검사

**구현 상태**:
- ✅ JSON 변환 함수 구현
- ❌ UI 구현 미완료

### 8. SQL 생성 - 우선순위: 높음, 복잡도: 높음
- [ ] 코호트 정의에서 SQL 생성
- [ ] 다양한 데이터베이스 유형 지원
- [ ] SQL 미리보기
- [ ] SQL 복사 및 내보내기

### 9. 결과 확인 및 통계 - 우선순위: 중간, 복잡도: 높음
- [ ] 코호트 실행 및 결과 확인
- [ ] 포함 규칙별 환자 분포
- [ ] 시간에 따른 환자 분포
- [ ] 특성 분석

### 10. 사용자 인터페이스 개선 - 우선순위: 중간, 복잡도: 중간
- [ ] 조건 중첩 시각화
- [ ] 유효성 검사 및 오류 표시
- [ ] 도움말 및 도구 설명
- [ ] 반응형 디자인

**구현 상태**:
- ✅ 기본적인 드래그 앤 드롭 구현

## 세부 구현 사항

### 데이터 구조 및 모델

#### 개념 집합(Concept Set)
```javascript
{
  id: <number>,
  name: <string>,
  expression: {
    items: [
      {
        concept: {
          CONCEPT_ID: <number>,
          CONCEPT_NAME: <string>,
          STANDARD_CONCEPT: <string>,
          STANDARD_CONCEPT_CAPTION: <string>,
          INVALID_REASON: <string>,
          INVALID_REASON_CAPTION: <string>,
          CONCEPT_CODE: <string>,
          DOMAIN_ID: <string>,
          VOCABULARY_ID: <string>,
          CONCEPT_CLASS_ID: <string>
        },
        isExcluded: <boolean>,
        includeDescendants: <boolean>,
        includeMapped: <boolean>
      }
    ]
  }
}
```

#### CriteriaGroup
```javascript
{
  Type: "ALL" | "ANY" | "AT_LEAST",
  Count: <number>, // AT_LEAST에서만 사용
  CriteriaList: [], // AdditionalCriteria 객체 배열
  DemographicCriteriaList: [], // DemographicCriteria 객체 배열
  Groups: [] // 중첩된 CriteriaGroup 배열
}
```

#### WindowedCriteria
```javascript
{
  Criteria: <Criteria Object>,
  StartWindow: {
    Start: {
      Days: <number>,
      Coeff: <number>
    },
    End: {
      Days: <number>,
      Coeff: <number>
    },
    UseEventEnd: <boolean>
  },
  EndWindow: {
    Start: {
      Days: <number>,
      Coeff: <number>
    },
    End: {
      Days: <number>,
      Coeff: <number>
    },
    UseEventEnd: <boolean>
  },
  Occurrence: {
    Type: <number>,
    Count: <number>,
    IsDistinct: <boolean>
  }
}
```

## 다음 단계 구현 계획

### 2단계: 기본 기능 구현
- 개념 집합 관리 시스템
  - 개념 집합 생성/편집/삭제 UI
  - 개념 검색 및 선택 인터페이스
  - 개념 속성 편집 UI
- 포함 규칙 편집기
  - 포함 규칙 편집 UI
  - 논리 연산자 설정 UI
  - 조건 그룹 편집 UI
- 저장 및 불러오기 기능
  - 저장/불러오기 UI
  - 코호트 목록 관리

### 3단계: 고급 기능 구현
- 종료 전략 및 검열 기준
- SQL 생성
- 결과 확인 및 통계

### 4단계: UI/UX 개선
- 사용자 인터페이스 개선
- 도움말 및 문서화
- 성능 최적화

## 기술적 고려 사항

- **상태 관리**: 복잡한 중첩 데이터 구조를 효과적으로 처리
- **백엔드 통합**: 개념 검색, SQL 생성, 결과 확인 등을 위한 API 연동
- **성능 최적화**: 대규모 개념 집합 및 복잡한 코호트 정의 처리
- **유효성 검사**: 사용자 입력의 유효성 검사 및 오류 처리
- **시각화**: 복잡한 포함 규칙 및 조건의 시각적 표현

## 결론

1단계 작업(코어 데이터 구조 완성)은 성공적으로 완료되었습니다. Atlas 코호트 빌더의 모든 주요 데이터 모델과 기본 함수가 구현되었으며, 이는 좋은 기반을 마련했습니다. 

현재는 데이터 모델은 갖추어졌지만 UI 구현이 필요한 상태입니다. 2단계 작업으로 개념 집합 관리, 포함 규칙 편집기, 저장/불러오기 기능에 중점을 두어 개발을 진행해야 합니다. 이러한 기능들을 단계적으로 구현함으로써 Atlas와 호환되는 완전한 코호트 빌더를 개발할 수 있을 것입니다.