<!-- 
	Atlas 프로젝트 기반 Cohort Builder 구현 - 모든 이벤트 타입 속성 구현
-->

<script>
	import '../../app.css';
	import { page } from '$app/state';
	import { 
		createEmptyCohortExpression, 
		createConceptSet,
		createCriteria,
		createInclusionRule,
		typeMapping,
		addPrimaryCriteria,
		removePrimaryCriteria,
		updatePrimaryCriteriaLimit,
		updateObservationWindow,
		addInclusionRule as addInclusionRuleToExpression,
		removeInclusionRule,
		cohortExpressionToJson,
		cohortExpressionFromJson,
		addConceptSet
	} from './models/index.js';
	import ConceptSetModal from './components/ConceptSetModal.svelte';
	
	let pathname = $state(page.url.pathname);

	// Atlas 코호트 구조 정의 - 모델 사용
	let cohortExpression = $state(createEmptyCohortExpression());
	
	// 이벤트 편집 관련 상태
	let selectedCriteriaType = $state(null); // 선택된 이벤트 유형
	let selectedConceptSet = $state(null); // 선택된 개념 집합
	let editingCriteriaIndex = $state(null); // 편집 중인 기준 인덱스
	
	// 현재 편집 중인 이벤트 속성 값
	let currentCriteriaValues = $state({
		// 공통 속성
		First: false, // 첫 번째 발생만 포함
		CodesetId: null, // 개념 집합 ID
		OccurrenceStartDate: null, // 발생 시작일
		OccurrenceEndDate: null, // 발생 종료일
		Age: null, // 연령
		Gender: [], // 성별
		ProviderSpecialty: [], // 제공자 전문성
		VisitType: [], // 방문 유형
		
		// 조건 관련 속성
		ConditionType: [],
		ConditionStatus: [],
		StopReason: null,
		
		// 약물 관련 속성
		DrugType: [],
		Refills: null,
		Quantity: null,
		DaysSupply: null,
		RouteConcept: [],
		EffectiveDrugDose: null,
		DoseUnit: [],
		
		// 측정 관련 속성
		MeasurementType: [],
		Operator: [],
		ValueAsNumber: null,
		ValueAsConcept: [],
		Unit: [],
		RangeLow: null,
		RangeHigh: null,
		Abnormal: false,
		
		// 관찰 관련 속성
		ObservationType: [],
		ValueAsString: null,
		Qualifier: [],
		
		// 시술 관련 속성
		ProcedureType: [],
		Modifier: [],
		
		// 검체 관련 속성
		SpecimenType: [],
		AnatomicSite: [],
		DiseaseStatus: [],
		
		// 방문 관련 속성
		VisitLength: null,
		
		// 기간 관련 속성
		PeriodType: [],
		PeriodLength: null,
		PeriodStartDate: null,
		PeriodEndDate: null,
		
		// 특수 속성
		EraLength: null
	});
	
	// 드롭다운 옵션
	const limitOptions = ["All", "First", "Last"];
	
	// 이벤트 타입 정의 (Atlas의 정의와 일치)
	const criteriaTypes = [
		{ id: "condition-era", name: "Condition Era", description: "특정 진단 기간을 가진 환자를 찾습니다." },
		{ id: "condition-occurrence", name: "Condition Occurrence", description: "특정 진단을 가진 환자를 찾습니다." },
		{ id: "death", name: "Death", description: "사망 정보를 기반으로 환자를 찾습니다." },
		{ id: "device-exposure", name: "Device Exposure", description: "기기 노출에 따라 환자를 찾습니다." },
		{ id: "dose-era", name: "Dose Era", description: "복용량 기간에 따라 환자를 찾습니다." },
		{ id: "drug-era", name: "Drug Era", description: "약물 복용 기간에 노출된 환자를 찾습니다." },
		{ id: "drug-exposure", name: "Drug Exposure", description: "약물 노출에 따라 환자를 찾습니다." },
		{ id: "measurement", name: "Measurement", description: "검사 측정 결과를 기반으로 환자를 찾습니다." },
		{ id: "observation", name: "Observation", description: "관찰 정보를 기반으로 환자를 찾습니다." },
		{ id: "observation-period", name: "Observation Period", description: "관찰 기간을 기반으로 환자를 찾습니다." },
		{ id: "procedure-occurrence", name: "Procedure Occurrence", description: "의료 시술을 받은 환자를 찾습니다." },
		{ id: "specimen", name: "Specimen", description: "검체 샘플을 기반으로 환자를 찾습니다." },
		{ id: "visit-occurrence", name: "Visit Occurrence", description: "병원 방문을 기반으로 환자를 찾습니다." },
		{ id: "visit-detail", name: "Visit Detail", description: "병원 방문 세부정보를 기반으로 환자를 찾습니다." },
		{ id: "demographic", name: "Demographic", description: "인구학적 특성(나이, 성별 등)을 기준으로 환자를 찾습니다." }
	];
	
	// 이벤트 타입별 속성 정의
	const criteriaProperties = {
		"condition-era": [
			{ name: "First", label: "First Occurrence Only", type: "checkbox" },
			{ name: "CodesetId", label: "Condition Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "Age", label: "Age at Era Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "EraLength", label: "Era Length", type: "numberrange" }
		],
		"condition-occurrence": [
			{ name: "First", label: "First Occurrence Only", type: "checkbox" },
			{ name: "CodesetId", label: "Condition Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "ConditionType", label: "Condition Type", type: "concept" },
			{ name: "StopReason", label: "Stop Reason", type: "text" },
			{ name: "Age", label: "Age at Occurrence", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" },
			{ name: "ConditionStatus", label: "Condition Status", type: "concept" }
		],
		"death": [
			{ name: "CodesetId", label: "Cause of Death Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Death Date", type: "daterange" },
			{ name: "Age", label: "Age at Death", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "DeathType", label: "Death Type", type: "concept" }
		],
		"device-exposure": [
			{ name: "First", label: "First Exposure Only", type: "checkbox" },
			{ name: "CodesetId", label: "Device Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "DeviceType", label: "Device Type", type: "concept" },
			{ name: "UniqueDeviceId", label: "Unique Device ID", type: "text" },
			{ name: "Quantity", label: "Quantity", type: "numberrange" },
			{ name: "Age", label: "Age at Exposure", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" }
		],
		"dose-era": [
			{ name: "First", label: "First Era Only", type: "checkbox" },
			{ name: "CodesetId", label: "Drug Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "DoseValue", label: "Dose Value", type: "numberrange" },
			{ name: "Unit", label: "Unit", type: "concept" },
			{ name: "EraLength", label: "Era Length", type: "numberrange" },
			{ name: "Age", label: "Age at Era Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" }
		],
		"drug-era": [
			{ name: "First", label: "First Era Only", type: "checkbox" },
			{ name: "CodesetId", label: "Drug Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "EraLength", label: "Era Length", type: "numberrange" },
			{ name: "Age", label: "Age at Era Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" }
		],
		"drug-exposure": [
			{ name: "First", label: "First Exposure Only", type: "checkbox" },
			{ name: "CodesetId", label: "Drug Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "DrugType", label: "Drug Type", type: "concept" },
			{ name: "StopReason", label: "Stop Reason", type: "text" },
			{ name: "Refills", label: "Refills", type: "numberrange" },
			{ name: "Quantity", label: "Quantity", type: "numberrange" },
			{ name: "DaysSupply", label: "Days Supply", type: "numberrange" },
			{ name: "RouteConcept", label: "Route", type: "concept" },
			{ name: "EffectiveDrugDose", label: "Effective Drug Dose", type: "numberrange" },
			{ name: "DoseUnit", label: "Dose Unit", type: "concept" },
			{ name: "Age", label: "Age at Exposure", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" }
		],
		"measurement": [
			{ name: "First", label: "First Measurement Only", type: "checkbox" },
			{ name: "CodesetId", label: "Measurement Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Measurement Date", type: "daterange" },
			{ name: "MeasurementType", label: "Measurement Type", type: "concept" },
			{ name: "Operator", label: "Operator", type: "concept" },
			{ name: "ValueAsNumber", label: "Value as Number", type: "numberrange" },
			{ name: "ValueAsConcept", label: "Value as Concept", type: "concept" },
			{ name: "Unit", label: "Unit", type: "concept" },
			{ name: "RangeLow", label: "Range Low", type: "numberrange" },
			{ name: "RangeHigh", label: "Range High", type: "numberrange" },
			{ name: "Abnormal", label: "Abnormal Result", type: "checkbox" },
			{ name: "Age", label: "Age at Measurement", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" }
		],
		"observation": [
			{ name: "First", label: "First Observation Only", type: "checkbox" },
			{ name: "CodesetId", label: "Observation Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Observation Date", type: "daterange" },
			{ name: "ObservationType", label: "Observation Type", type: "concept" },
			{ name: "ValueAsNumber", label: "Value as Number", type: "numberrange" },
			{ name: "ValueAsConcept", label: "Value as Concept", type: "concept" },
			{ name: "ValueAsString", label: "Value as String", type: "text" },
			{ name: "Qualifier", label: "Qualifier", type: "concept" },
			{ name: "Unit", label: "Unit", type: "concept" },
			{ name: "Age", label: "Age at Observation", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" }
		],
		"observation-period": [
			{ name: "PeriodType", label: "Period Type", type: "concept" },
			{ name: "PeriodLength", label: "Period Length", type: "numberrange" },
			{ name: "PeriodStartDate", label: "Period Start Date", type: "daterange" },
			{ name: "PeriodEndDate", label: "Period End Date", type: "daterange" },
			{ name: "Age", label: "Age at Period Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" }
		],
		"procedure-occurrence": [
			{ name: "First", label: "First Procedure Only", type: "checkbox" },
			{ name: "CodesetId", label: "Procedure Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Procedure Date", type: "daterange" },
			{ name: "ProcedureType", label: "Procedure Type", type: "concept" },
			{ name: "Modifier", label: "Modifier", type: "concept" },
			{ name: "Quantity", label: "Quantity", type: "numberrange" },
			{ name: "Age", label: "Age at Procedure", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" },
			{ name: "VisitType", label: "Visit Type", type: "concept" }
		],
		"specimen": [
			{ name: "First", label: "First Specimen Only", type: "checkbox" },
			{ name: "CodesetId", label: "Specimen Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Specimen Date", type: "daterange" },
			{ name: "SpecimenType", label: "Specimen Type", type: "concept" },
			{ name: "Quantity", label: "Quantity", type: "numberrange" },
			{ name: "Unit", label: "Unit", type: "concept" },
			{ name: "AnatomicSite", label: "Anatomic Site", type: "concept" },
			{ name: "DiseaseStatus", label: "Disease Status", type: "concept" },
			{ name: "Age", label: "Age at Specimen Collection", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" }
		],
		"visit-occurrence": [
			{ name: "First", label: "First Visit Only", type: "checkbox" },
			{ name: "CodesetId", label: "Visit Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "VisitType", label: "Visit Type", type: "concept" },
			{ name: "VisitLength", label: "Visit Length", type: "numberrange" },
			{ name: "Age", label: "Age at Visit Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" }
		],
		"visit-detail": [
			{ name: "First", label: "First Visit Detail Only", type: "checkbox" },
			{ name: "CodesetId", label: "Visit Detail Concept Set", type: "conceptset" },
			{ name: "OccurrenceStartDate", label: "Start Date", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "End Date", type: "daterange" },
			{ name: "VisitType", label: "Visit Type", type: "concept" },
			{ name: "VisitLength", label: "Visit Length", type: "numberrange" },
			{ name: "Age", label: "Age at Visit Detail Start", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "ProviderSpecialty", label: "Provider Specialty", type: "concept" }
		],
		"demographic": [
			{ name: "Age", label: "Age", type: "numberrange" },
			{ name: "Gender", label: "Gender", type: "concept" },
			{ name: "Race", label: "Race", type: "concept" },
			{ name: "Ethnicity", label: "Ethnicity", type: "concept" },
			{ name: "OccurrenceStartDate", label: "Date Range Start", type: "daterange" },
			{ name: "OccurrenceEndDate", label: "Date Range End", type: "daterange" }
		]
	};
	
	// 각 이벤트 타입에 맞는 빈 객체 생성 함수
	function createEmptyCriteria(type) {
		const atlasType = typeMapping[type];
		const criteria = {};
		
		// 기본 객체 생성
		criteria[atlasType] = {
			CodesetId: currentCriteriaValues.CodesetId
		};
		
		// 이벤트 유형별로 속성들을 추가
		const properties = criteriaProperties[type] || [];
		
		for (const property of properties) {
			// 값이 정의되어 있고 기본값이 아닌 경우만 추가
			if (currentCriteriaValues[property.name] !== null && 
				!(property.type === 'checkbox' && currentCriteriaValues[property.name] === false) &&
				!(Array.isArray(currentCriteriaValues[property.name]) && currentCriteriaValues[property.name].length === 0)) {
				
				criteria[atlasType][property.name] = currentCriteriaValues[property.name];
			}
		}
		
		return criteria;
	}
	
	// 범위 값 생성 헬퍼 함수
	function createRange(min, max) {
		const range = {};
		if (min !== null && min !== undefined && min !== "") {
			range.Value = Number(min);
		}
		if (max !== null && max !== undefined && max !== "") {
			range.Extent = Number(max);
		}
		return Object.keys(range).length > 0 ? range : null;
	}
	
	// 날짜 범위 생성 헬퍼 함수
	function createDateRange(start, end) {
		const range = {};
		if (start) {
			range.Value = start;
		}
		if (end) {
			range.Extent = end;
		}
		return Object.keys(range).length > 0 ? range : null;
	}
	
	// 이벤트 추가 함수
	function addCriteria() {
		if (!selectedCriteriaType) return;
		
		const newCriteria = createEmptyCriteria(selectedCriteriaType);
		
		if (editingCriteriaIndex !== null) {
			// 이벤트 업데이트
			cohortExpression.PrimaryCriteria.CriteriaList[editingCriteriaIndex] = newCriteria;
			editingCriteriaIndex = null;
		} else {
			// 새 이벤트 추가
			cohortExpression = addPrimaryCriteria(cohortExpression, newCriteria);
		}
		
		// 선택 초기화
		selectedCriteriaType = null;
		resetCriteriaValues();
	}
	
	// 이벤트 편집 함수
	function editCriteria(index) {
		editingCriteriaIndex = index;
		const criteria = cohortExpression.PrimaryCriteria.CriteriaList[index];
		const type = Object.keys(criteria)[0];
		
		// 타입 매핑 역변환 - 모델의 typeMapping 사용
		selectedCriteriaType = typeMapping[type];
		resetCriteriaValues(); // 기존 값 초기화
		
		// 기존 값 로드
		const criteriaData = criteria[type];
		for (const key in criteriaData) {
			if (criteriaData.hasOwnProperty(key)) {
				currentCriteriaValues[key] = criteriaData[key];
			}
		}
	}
	
	// 이벤트 제거 함수
	function removeCriteria(index) {
		cohortExpression = removePrimaryCriteria(cohortExpression, index);
	}
	
	// 현재 기준 값 초기화
	function resetCriteriaValues() {
		currentCriteriaValues = {
			First: false,
			CodesetId: null,
			OccurrenceStartDate: null,
			OccurrenceEndDate: null,
			Age: null,
			Gender: [],
			ProviderSpecialty: [],
			VisitType: [],
			ConditionType: [],
			ConditionStatus: [],
			StopReason: null,
			DrugType: [],
			Refills: null,
			Quantity: null,
			DaysSupply: null,
			RouteConcept: [],
			EffectiveDrugDose: null,
			DoseUnit: [],
			MeasurementType: [],
			Operator: [],
			ValueAsNumber: null,
			ValueAsConcept: [],
			Unit: [],
			RangeLow: null,
			RangeHigh: null,
			Abnormal: false,
			ObservationType: [],
			ValueAsString: null,
			Qualifier: [],
			ProcedureType: [],
			Modifier: [],
			SpecimenType: [],
			AnatomicSite: [],
			DiseaseStatus: [],
			VisitLength: null,
			PeriodType: [],
			PeriodLength: null,
			PeriodStartDate: null,
			PeriodEndDate: null,
			EraLength: null
		};
	}
	
	// Atlas 형식의 이벤트 타입 표시 이름 가져오기
	function getCriteriaTypeName(criteria) {
		return Object.keys(criteria)[0].replace(/([A-Z])/g, ' $1').trim();
	}
	
	// 개념 집합 선택 함수
	function selectConceptSet(id) {
		currentCriteriaValues.CodesetId = id;
	}
	
	// 포함 규칙 추가 함수
	function addInclusionRule() {
		const newRule = createInclusionRule({
			name: `Inclusion Criteria ${cohortExpression.InclusionRules.length + 1}`,
			expression: {
				Type: "ALL",
				CriteriaList: [],
				DemographicCriteriaList: [],
				Groups: []
			}
		});
		cohortExpression = addInclusionRuleToExpression(cohortExpression, newRule);
	}
	
	// 코호트 표현식 JSON 문자열 반환
	function getCohortExpressionJSON() {
		return cohortExpressionToJson(cohortExpression);
	}
	
	// 드래그 앤 드롭 관련 변수
	let draggedItem = $state(null);
	let draggedItemIndex = $state(null);
	let hoveredItemIndex = $state(null);
	
	// 드래그 앤 드롭 순서 변경
	$effect(() => {
		if (draggedItemIndex !== null && hoveredItemIndex !== null && draggedItemIndex !== hoveredItemIndex) {
			const criteriaList = [...cohortExpression.PrimaryCriteria.CriteriaList];
			
			const temp = criteriaList[draggedItemIndex];
			criteriaList[draggedItemIndex] = criteriaList[hoveredItemIndex];
			criteriaList[hoveredItemIndex] = temp;
			
			cohortExpression.PrimaryCriteria.CriteriaList = criteriaList;
			draggedItemIndex = hoveredItemIndex;
		}
	});
	
	// 이벤트 속성 업데이트 함수
	function updateCriteriaValue(property, value) {
		currentCriteriaValues[property] = value;
	}
	
	// 숫자 범위 입력 필드
	function updateNumberRange(property, min, max) {
		currentCriteriaValues[property] = createRange(min, max);
	}
	
	// 날짜 범위 입력 필드
	function updateDateRange(property, start, end) {
		currentCriteriaValues[property] = createDateRange(start, end);
	}
	
	// 기초 값 및 숫자 입력용
	let tempValues = $state({});
	
	// 개념 집합 모달 관련 상태
	let showConceptSetModal = $state(false);
	
	// 개념 집합 업데이트 처리
	function handleConceptSetUpdate(event) {
		// 모달에서 업데이트된 개념 집합 목록 가져오기
		const { conceptSets } = event.detail;
		
		// 코호트 표현식 업데이트
		cohortExpression = {
			...cohortExpression,
			ConceptSets: conceptSets
		};
	}
</script>

<header class="fixed left-0 top-0 z-10 flex h-10 w-full border-b border-gray-300 bg-white shadow-sm">
	<p class="flex w-[200px] items-center justify-center border-r border-gray-300 text-center text-lg font-bold text-gray-800">
		Bento
	</p>
	<div class="flex items-center gap-6 pl-4 text-sm">
		<a
			href="/cohort"
			class="w-fit text-center {pathname === '/cohort' ? 'font-semibold text-blue-600' : 'text-gray-700 hover:text-blue-500'}"
		>
			코호트 정의
		</a>
		<a
			href="/inference"
			class="w-fit text-center {pathname === '/inference' ? 'font-semibold text-blue-600' : 'text-gray-700 hover:text-blue-500'}"
		>
			모델 인퍼런스
		</a>
	</div>
</header>

<!-- 좌측 사이드바 -->
<div class="fixed left-0 top-10 flex h-[calc(100vh-40px)] w-[200px] flex-col overflow-y-auto border-r border-gray-300 bg-gray-50">
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<h3 class="mb-3 text-sm font-bold text-gray-700">Primary Criteria</h3>
		{#if cohortExpression.PrimaryCriteria.CriteriaList.length === 0}
			<p class="mb-2 ml-2 text-xs text-gray-500 italic">No primary criteria defined</p>
		{:else}
			{#each cohortExpression.PrimaryCriteria.CriteriaList as criteria}
				<div class="mb-2 rounded-md bg-blue-50 px-2 py-1">
					<p class="text-xs font-medium text-blue-700">{getCriteriaTypeName(criteria)}</p>
				</div>
			{/each}
		{/if}
	</div>
	
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<h3 class="mb-3 text-sm font-bold text-gray-700">Inclusion Criteria</h3>
		{#if cohortExpression.InclusionRules.length === 0}
			<p class="mb-2 ml-2 text-xs text-gray-500 italic">No inclusion criteria defined</p>
		{:else}
			{#each cohortExpression.InclusionRules as rule, index}
				<div class="mb-2 rounded-md bg-green-50 px-2 py-1">
					<p class="text-xs font-medium text-green-700">{rule.name}</p>
				</div>
			{/each}
		{/if}
	</div>
	
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-bold text-gray-700">Concept Sets</h3>
			<button 
				class="text-xs text-blue-600 hover:text-blue-800"
				on:click={() => showConceptSetModal = true}
			>
				Manage
			</button>
		</div>
		{#if cohortExpression.ConceptSets.length === 0}
			<p class="mb-2 ml-2 text-xs text-gray-500 italic">No concept sets defined</p>
		{:else}
			{#each cohortExpression.ConceptSets as conceptSet}
				<div class="mb-2 rounded-md bg-purple-50 px-2 py-1">
					<p class="text-xs font-medium text-purple-700">{conceptSet.name}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- 메인 컨텐츠 영역 -->
<div class="fixed left-[200px] top-10 h-[calc(100vh-40px)] w-[calc(100vw-200px)] overflow-y-auto">
	<div class="flex h-full">
		<!-- 메인 패널 -->
		<div class="flex flex-1 flex-col p-5">
			<div class="mb-8">
				<h1 class="mb-2 text-2xl font-bold text-gray-800">Cohort Definition</h1>
				<p class="text-sm text-gray-600">Define the characteristics of patients to include in your cohort.</p>
			</div>
			
			<!-- 초기 이벤트 설정 -->
			<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h2 class="mb-3 text-xl font-bold text-gray-800">Cohort Entry Events</h2>
				<p class="mb-4 text-sm text-gray-600">Define initial events that qualify a person for cohort entry.</p>
				
				<div class="mb-4 flex items-center gap-2">
					<span class="text-sm text-gray-700">with continuous observation of at least</span>
					<input 
						type="number" 
						min="0"
						value={cohortExpression.PrimaryCriteria.ObservationWindow.PriorDays}
						on:change={(e) => {
							const priorDays = parseInt(e.target.value) || 0;
							const postDays = cohortExpression.PrimaryCriteria.ObservationWindow.PostDays;
							cohortExpression = updateObservationWindow(cohortExpression, priorDays, postDays);
						}}
						class="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
					/>
					<span class="text-sm text-gray-700">days before and</span>
					<input 
						type="number"
						min="0" 
						value={cohortExpression.PrimaryCriteria.ObservationWindow.PostDays}
						on:change={(e) => {
							const postDays = parseInt(e.target.value) || 0;
							const priorDays = cohortExpression.PrimaryCriteria.ObservationWindow.PriorDays;
							cohortExpression = updateObservationWindow(cohortExpression, priorDays, postDays);
						}}
						class="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
					/>
					<span class="text-sm text-gray-700">days after event index date</span>
				</div>
				
				<div class="mb-4 flex items-center gap-2">
					<span class="text-sm text-gray-700">Limit initial events to:</span>
					<select 
						value={cohortExpression.PrimaryCriteria.PrimaryCriteriaLimit.Type}
						on:change={(e) => {
							cohortExpression = updatePrimaryCriteriaLimit(cohortExpression, e.target.value);
						}}
						class="rounded border border-gray-300 px-2 py-1 text-sm"
					>
						{#each limitOptions as option}
							<option value={option}>{option.toLowerCase()} event</option>
						{/each}
					</select>
					<span class="text-sm text-gray-700">per person.</span>
				</div>
			</div>
			
			<!-- 이벤트 목록 -->
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-800">Events having any of the following criteria:</h3>
				</div>
				
				{#if cohortExpression.PrimaryCriteria.CriteriaList.length === 0}
					<div class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-8">
						<p class="text-gray-500">No events added. Use the panel on the right to add initial events.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each cohortExpression.PrimaryCriteria.CriteriaList as criteria, index}
							<div 
								class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
								draggable="true"
								on:dragstart={() => {
									draggedItem = criteria;
									draggedItemIndex = index;
								}}
								on:dragover|preventDefault={() => {
									hoveredItemIndex = index;
								}}
								on:drop|preventDefault={() => {
									draggedItem = null;
									draggedItemIndex = null;
									hoveredItemIndex = null;
								}}
							>
								<div class="flex items-center justify-between mb-3">
									<h4 class="text-lg font-medium text-blue-600">{getCriteriaTypeName(criteria)}</h4>
									<div class="flex space-x-2">
										<button 
											class="text-sm text-blue-500 hover:text-blue-700"
											on:click={() => editCriteria(index)}
										>
											Edit
										</button>
										<button 
											class="text-sm text-red-500 hover:text-red-700"
											on:click={() => removeCriteria(index)}
										>
											Remove
										</button>
									</div>
								</div>
								
								<div class="text-sm text-gray-700">
									<!-- 이벤트 상세 정보 표시 -->
									{#if Object.keys(criteria)[0] === 'ConditionEra'}
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											{#if criteria.ConditionEra.CodesetId !== null}
												<p><span class="font-medium">Condition Era:</span> Concept Set ID {criteria.ConditionEra.CodesetId}</p>
											{:else}
												<p><span class="font-medium">Condition Era:</span> Any Condition</p>
											{/if}
											
											{#if criteria.ConditionEra.First}
												<p><span class="font-medium">First Occurrence Only:</span> Yes</p>
											{/if}
											
											{#if criteria.ConditionEra.OccurrenceStartDate}
												<p><span class="font-medium">Start Date:</span> {JSON.stringify(criteria.ConditionEra.OccurrenceStartDate)}</p>
											{/if}
											
											{#if criteria.ConditionEra.EraLength}
												<p><span class="font-medium">Era Length:</span> {JSON.stringify(criteria.ConditionEra.EraLength)}</p>
											{/if}
											
											{#if criteria.ConditionEra.Age}
												<p><span class="font-medium">Age at Era Start:</span> {JSON.stringify(criteria.ConditionEra.Age)}</p>
											{/if}
										</div>
									{:else if Object.keys(criteria)[0] === 'ConditionOccurrence'}
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											{#if criteria.ConditionOccurrence.CodesetId !== null}
												<p><span class="font-medium">Condition:</span> Concept Set ID {criteria.ConditionOccurrence.CodesetId}</p>
											{:else}
												<p><span class="font-medium">Condition:</span> Any Condition</p>
											{/if}
											
											{#if criteria.ConditionOccurrence.First}
												<p><span class="font-medium">First Occurrence Only:</span> Yes</p>
											{/if}
											
											{#if criteria.ConditionOccurrence.OccurrenceStartDate}
												<p><span class="font-medium">Start Date:</span> {JSON.stringify(criteria.ConditionOccurrence.OccurrenceStartDate)}</p>
											{/if}
											
											{#if criteria.ConditionOccurrence.Age}
												<p><span class="font-medium">Age at Occurrence:</span> {JSON.stringify(criteria.ConditionOccurrence.Age)}</p>
											{/if}
										</div>
									{:else if Object.keys(criteria)[0] === 'DrugExposure'}
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											{#if criteria.DrugExposure.CodesetId !== null}
												<p><span class="font-medium">Drug:</span> Concept Set ID {criteria.DrugExposure.CodesetId}</p>
											{:else}
												<p><span class="font-medium">Drug:</span> Any Drug</p>
											{/if}
											
											{#if criteria.DrugExposure.First}
												<p><span class="font-medium">First Exposure Only:</span> Yes</p>
											{/if}
											
											{#if criteria.DrugExposure.OccurrenceStartDate}
												<p><span class="font-medium">Start Date:</span> {JSON.stringify(criteria.DrugExposure.OccurrenceStartDate)}</p>
											{/if}
											
											{#if criteria.DrugExposure.DaysSupply}
												<p><span class="font-medium">Days Supply:</span> {JSON.stringify(criteria.DrugExposure.DaysSupply)}</p>
											{/if}
										</div>
									{:else}
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											{#if criteria[Object.keys(criteria)[0]].CodesetId !== null}
												<p><span class="font-medium">Concept Set ID:</span> {criteria[Object.keys(criteria)[0]].CodesetId}</p>
											{:else}
												<p><span class="font-medium">Concept Set:</span> Not specified</p>
											{/if}
											
											{#if criteria[Object.keys(criteria)[0]].First}
												<p><span class="font-medium">First Occurrence Only:</span> Yes</p>
											{/if}
											
											<p><span class="font-medium">Additional settings configured:</span> {Object.keys(criteria[Object.keys(criteria)[0]]).length} properties</p>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- 포함 규칙 섹션 -->
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-800">Inclusion Rules</h3>
					<button 
						class="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
						on:click={addInclusionRule}
					>
						Add Inclusion Rule
					</button>
				</div>
				
				{#if cohortExpression.InclusionRules.length === 0}
					<div class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-8">
						<p class="text-gray-500">No inclusion rules defined. Click the "Add Inclusion Rule" button to create one.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each cohortExpression.InclusionRules as rule, index}
							<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
								<div class="flex items-center justify-between mb-3">
									<h4 class="text-lg font-medium text-green-600">{rule.name}</h4>
									<div class="flex space-x-2">
										<button class="text-sm text-blue-500 hover:text-blue-700">
											Edit
										</button>
										<button class="text-sm text-red-500 hover:text-red-700">
											Remove
										</button>
									</div>
								</div>
								
								<div class="text-sm text-gray-700">
									<p>Click to configure inclusion rule</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- 코호트 JSON 표시 (디버깅용) -->
			<div class="mb-6 rounded-lg border border-gray-200 p-4">
				<h3 class="mb-2 text-lg font-semibold text-gray-800">Cohort Definition JSON</h3>
				<pre class="h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs">{getCohortExpressionJSON()}</pre>
			</div>
		</div>
		
		<!-- 우측 패널 - 이벤트 추가/편집 -->
		<div class="w-[400px] border-l border-gray-300 bg-gray-50 p-5 overflow-y-auto">
			{#if selectedCriteriaType === null}
				<div class="mb-4">
					<h3 class="mb-3 text-xl font-bold text-gray-800">Add Criteria</h3>
					<p class="mb-4 text-sm text-gray-600">Select an event type to add to your cohort.</p>
				</div>
				
				<div class="space-y-2">
					{#each criteriaTypes as criteria}
						<button
							class="w-full rounded-md border border-blue-200 bg-white p-3 text-left transition-colors hover:bg-blue-50"
							on:click={() => selectedCriteriaType = criteria.id}
						>
							<div class="flex items-center justify-between">
								<span class="font-medium text-blue-600">{criteria.name}</span>
								<span class="text-xs text-gray-500">?</span>
							</div>
							<p class="mt-1 text-xs text-gray-500">{criteria.description}</p>
						</button>
					{/each}
				</div>
			{:else}
				<!-- 특정 이벤트 타입 편집 -->
				<div class="mb-4">
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-bold text-gray-800">
							{criteriaTypes.find(c => c.id === selectedCriteriaType).name}
						</h3>
						<button 
							class="text-sm text-gray-500 hover:text-gray-700"
							on:click={() => {
								selectedCriteriaType = null;
								editingCriteriaIndex = null;
							}}
						>
							Cancel
						</button>
					</div>
					<p class="mb-4 text-sm text-gray-600">Configure event criteria.</p>
				</div>
				
				<div class="mb-6 space-y-4">
					{#if criteriaProperties[selectedCriteriaType]}
						{#each criteriaProperties[selectedCriteriaType] as property}
							<!-- 속성 타입에 따라 다른 입력 필드 표시 -->
							<div class="mb-3">
								<label class="mb-1 block text-sm font-medium text-gray-700">
									{property.label}
								</label>
								
								{#if property.type === 'checkbox'}
									<div class="flex items-center">
										<input 
											type="checkbox" 
											class="h-4 w-4 rounded border-gray-300 text-blue-600" 
											checked={currentCriteriaValues[property.name]}
											on:change={(e) => updateCriteriaValue(property.name, e.target.checked)}
										/>
										<span class="ml-2 text-sm text-gray-600">
											{property.name === 'First' ? 'Limit to first occurrence' : property.name === 'Abnormal' ? 'Abnormal result only' : ''}
										</span>
									</div>
								{:else if property.type === 'conceptset'}
									<select
										class="w-full rounded-md border border-gray-300 p-2 text-sm"
										on:change={(e) => updateCriteriaValue(property.name, e.target.value === "null" ? null : Number(e.target.value))}
									>
										<option value="null">Any</option>
										{#each cohortExpression.ConceptSets as conceptSet, i}
											<option value={i} selected={currentCriteriaValues[property.name] === i}>{conceptSet.name || `Concept Set ${i+1}`}</option>
										{/each}
									</select>
								{:else if property.type === 'concept'}
									<div class="flex items-center">
										<span class="text-sm text-gray-600 italic">
											Concept selection not implemented in this demo
										</span>
									</div>
								{:else if property.type === 'numberrange'}
									<div class="flex items-center gap-2">
										<input 
											type="number" 
											min="0" 
											placeholder="Min" 
											class="w-20 rounded-md border border-gray-300 p-1 text-sm"
											value={currentCriteriaValues[property.name]?.Value || ''}
											on:change={(e) => {
												if (!tempValues[property.name]) tempValues[property.name] = {};
												tempValues[property.name].min = e.target.value;
												updateNumberRange(
													property.name, 
													tempValues[property.name].min,
													tempValues[property.name].max
												);
											}}
										/>
										<span class="text-gray-600">to</span>
										<input 
											type="number" 
											min="0" 
											placeholder="Max" 
											class="w-20 rounded-md border border-gray-300 p-1 text-sm"
											value={currentCriteriaValues[property.name]?.Extent || ''}
											on:change={(e) => {
												if (!tempValues[property.name]) tempValues[property.name] = {};
												tempValues[property.name].max = e.target.value;
												updateNumberRange(
													property.name, 
													tempValues[property.name].min,
													tempValues[property.name].max
												);
											}}
										/>
										<span class="text-sm text-gray-600">
											{property.name === 'Age' ? 'years' : 
											 property.name === 'VisitLength' || property.name === 'PeriodLength' || property.name === 'EraLength' ? 'days' : ''}
										</span>
									</div>
								{:else if property.type === 'daterange'}
									<div class="flex items-center gap-2">
										<input 
											type="date" 
											class="rounded-md border border-gray-300 p-1 text-sm"
											value={currentCriteriaValues[property.name]?.Value || ''}
											on:change={(e) => {
												if (!tempValues[property.name]) tempValues[property.name] = {};
												tempValues[property.name].start = e.target.value;
												updateDateRange(
													property.name, 
													tempValues[property.name].start,
													tempValues[property.name].end
												);
											}}
										/>
										<span class="text-gray-600">to</span>
										<input 
											type="date" 
											class="rounded-md border border-gray-300 p-1 text-sm"
											value={currentCriteriaValues[property.name]?.Extent || ''}
											on:change={(e) => {
												if (!tempValues[property.name]) tempValues[property.name] = {};
												tempValues[property.name].end = e.target.value;
												updateDateRange(
													property.name, 
													tempValues[property.name].start,
													tempValues[property.name].end
												);
											}}
										/>
									</div>
								{:else if property.type === 'text'}
									<input 
										type="text" 
										class="w-full rounded-md border border-gray-300 p-2 text-sm"
										value={currentCriteriaValues[property.name]?.Text || ''}
										on:change={(e) => updateCriteriaValue(property.name, { Text: e.target.value })}
									/>
								{/if}
							</div>
						{/each}
					{:else}
						<p class="text-gray-600 italic">No properties available for this criteria type.</p>
					{/if}
				</div>
				
				<div class="mt-6 flex justify-end">
					<button
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
						on:click={addCriteria}
					>
						{editingCriteriaIndex !== null ? 'Update' : 'Add'} Criteria
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- 개념 집합 관리 모달 -->
<ConceptSetModal 
	bind:show={showConceptSetModal}
	conceptSets={cohortExpression.ConceptSets}
	on:update={handleConceptSetUpdate}
	on:close={() => showConceptSetModal = false}
/>