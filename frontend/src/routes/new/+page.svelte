<!-- 
	New Cohort Builder Implementation - Based on types.ts specification
-->

<script lang="ts">
	import '../../app.css';
	import { page } from '$app/state';
	import ConceptSetModal from './components/ConceptSetModal.svelte';
	import InclusionRuleModal from './components/InclusionRuleModal.svelte';
	import CohortAIModal from './components/CohortAIModal.svelte';
	import type { ConceptSet, Concept } from './models/ConceptSet';

	// 타입 정의 - backend/api/src/types/type.ts에서 가져옴
	interface Operator<T> {
		neq?: T | T[];
		eq?: T | T[];
		gt?: T | T[];
		gte?: T | T[];
		lt?: T | T[];
		lte?: T | T[];
	}
	
	interface StringOperator {
		neq?: string | string[];
		eq?: string | string[];
		startsWith?: string | string[];
		endsWith?: string | string[];
		contains?: string | string[];
	}
	
	type Identifier = string;
	
	interface IdentifierOperator {
		neq?: Identifier | Identifier[];
		eq?: Identifier | Identifier[];
	}
	
	type NumberWithOperator = number | Operator<number>;
	type IdentifierWithOperator = Identifier | IdentifierOperator;
	type DateWithOperator = string | Operator<string>;
	type StringWithOperator = string | StringOperator;
	
	interface BaseContainer {
		name: string;
		filters: Filter[];
		operator?: 'AND' | 'OR' | 'NOT';
	}
	
	interface BaseGroup {
		containers: BaseContainer[];
	}
	
	interface Concept {
		concept_id: Identifier;
		concept_name: string;
		domain_id?: string;
		vocabulary_id?: string;
		concept_class_id?: string;
		standard_concept?: string;
		concept_code?: string;
		valid_start_date?: string;
		valid_end_date?: string;
		invalid_reason?: string;
		isExcluded?: boolean;
		includeDescendants?: boolean;
		includeMapped?: boolean;
	}
	
	interface ConceptSet {
		conceptset_id: Identifier;
		name: string;
		expression?: {
			items: {
				concept: Concept;
			}[];
		};
	}
	
	interface CohortDefinition {
		conceptsets: ConceptSet[];
		initialGroup: BaseGroup;
		comparisonGroup?: BaseGroup;
	}
	
	type DomainType = string;
	
	interface Filter {
		type: DomainType;
		conceptset?: IdentifierWithOperator;
		first?: boolean;
		[key: string]: any;
	}
	
	// 현재 필터 속성 값의 타입
	interface FilterValues {
		[key: string]: any;
		conceptset?: IdentifierWithOperator;
	}

	let pathname = $state(page.url.pathname);
	let showCohortAIModal = $state(false);

	let cohortName = $state('Cohort Name');
	let cohortDescription = $state('Edit Cohort Description');

	// 코호트 정의 기본 구조 - CohortDefinition 타입 적용
	let cohortDefinition = $state<CohortDefinition>({
		conceptsets: [],
		initialGroup: {
			containers: [
				// 첫 번째 컨테이너 (필수)
				{
					name: 'Container 1',
					filters: []
				}
			]
		},
		// comparisonGroup은 옵션
		comparisonGroup: {
			containers: [
				{
					name: 'Container 1',
					filters: []
				}
			]
		}
	});

	// Handle AI generated cohort
	function handleCohortAISubmit(data: any) {
		console.log('AI Cohort Data:', data);
		// Here you would process the AI-generated cohort definition
		// and update the cohortDefinition state
	}

	// Types.ts 기반 도메인 타입
	const domainTypes = [
		{
			type: 'condition_era',
			name: 'Condition Era',
			description: 'Find patients with specific diagnosis periods.'
		},
		{
			type: 'condition_occurrence',
			name: 'Condition Occurrence',
			description: 'Find patients with specific diagnoses.'
		},
		{ type: 'death', name: 'Death', description: 'Find patients based on death information.' },
		{
			type: 'device_exposure',
			name: 'Device Exposure',
			description: 'Find patients based on device exposure.'
		},
		{ type: 'dose_era', name: 'Dose Era', description: 'Find patients based on dose periods.' },
		{
			type: 'drug_era',
			name: 'Drug Era',
			description: 'Find patients exposed to drug during periods.'
		},
		{
			type: 'drug_exposure',
			name: 'Drug Exposure',
			description: 'Find patients based on drug exposure.'
		},
		{
			type: 'measurement',
			name: 'Measurement',
			description: 'Find patients based on test measurement results.'
		},
		{
			type: 'observation',
			name: 'Observation',
			description: 'Find patients based on observation information.'
		},
		{
			type: 'observation_period',
			name: 'Observation Period',
			description: 'Find patients based on observation periods.'
		},
		{
			type: 'procedure_occurrence',
			name: 'Procedure Occurrence',
			description: 'Find patients who received medical procedures.'
		},
		{ type: 'specimen', name: 'Specimen', description: 'Find patients based on specimen samples.' },
		{
			type: 'visit_occurrence',
			name: 'Visit Occurrence',
			description: 'Find patients based on hospital visits.'
		},
		{
			type: 'demographic',
			name: 'Demographics',
			description: 'Find patients based on demographic information like gender, race, and ethnicity.'
		}
	];

	// 도메인별 속성 정의
	const domainProperties = {
		condition_era: [
			{ name: 'conceptset', label: 'Condition Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Occurrence Only', type: 'checkbox' },
			{ name: 'startAge', label: 'Age at Era Start', type: 'numberrange' },
			{ name: 'endAge', label: 'Age at Era End', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'conditionCount', label: 'Condition Count', type: 'numberrange' },
			{ name: 'length', label: 'Era Length', type: 'numberrange' }
		],
		condition_occurrence: [
			{ name: 'conceptset', label: 'Condition Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Occurrence Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Occurrence', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'conditionStatus', label: 'Condition Status', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'conditionType', label: 'Condition Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' }
		],
		death: [
			{ name: 'conceptset', label: 'Cause of Death Concept Set', type: 'conceptset' },
			{ name: 'age', label: 'Age at Death', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'date', label: 'Death Date', type: 'daterange' },
			{ name: 'deathType', label: 'Death Type', type: 'concept' },
			{ name: 'cause', label: 'Cause', type: 'concept' }
		],
		device_exposure: [
			{ name: 'conceptset', label: 'Device Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Exposure Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Exposure', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'deviceType', label: 'Device Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'uniqueDeviceId', label: 'Unique Device ID', type: 'string' },
			{ name: 'quantity', label: 'Quantity', type: 'numberrange' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' }
		],
		dose_era: [
			{ name: 'conceptset', label: 'Drug Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Era Only', type: 'checkbox' },
			{ name: 'startAge', label: 'Age at Era Start', type: 'numberrange' },
			{ name: 'endAge', label: 'Age at Era End', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'doseUnit', label: 'Dose Unit', type: 'concept' },
			{ name: 'length', label: 'Era Length', type: 'numberrange' },
			{ name: 'doseValue', label: 'Dose Value', type: 'numberrange' }
		],
		drug_era: [
			{ name: 'conceptset', label: 'Drug Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Era Only', type: 'checkbox' },
			{ name: 'startAge', label: 'Age at Era Start', type: 'numberrange' },
			{ name: 'endAge', label: 'Age at Era End', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'length', label: 'Era Length', type: 'numberrange' },
			{ name: 'eraExposureCount', label: 'Era Exposure Count', type: 'numberrange' }
		],
		drug_exposure: [
			{ name: 'conceptset', label: 'Drug Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Exposure Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Exposure', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'drugType', label: 'Drug Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'stopReason', label: 'Stop Reason', type: 'string' },
			{ name: 'refill', label: 'Refill', type: 'numberrange' },
			{ name: 'quantity', label: 'Quantity', type: 'numberrange' },
			{ name: 'daysSupply', label: 'Days Supply', type: 'numberrange' },
			{ name: 'routeType', label: 'Route Type', type: 'concept' },
			{ name: 'effectiveDose', label: 'Effective Dose', type: 'numberrange' },
			{ name: 'doseUnit', label: 'Dose Unit', type: 'concept' },
			{ name: 'lotNumber', label: 'Lot Number', type: 'string' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' }
		],
		measurement: [
			{ name: 'conceptset', label: 'Measurement Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Measurement Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Measurement', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'date', label: 'Measurement Date', type: 'daterange' },
			{ name: 'measurementType', label: 'Measurement Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'operatorType', label: 'Operator Type', type: 'concept' },
			{ name: 'valueAsNumber', label: 'Value as Number', type: 'numberrange' },
			{ name: 'valueAsConcept', label: 'Value as Concept', type: 'concept' },
			{ name: 'unitType', label: 'Unit Type', type: 'concept' },
			{ name: 'abnormal', label: 'Abnormal Result', type: 'checkbox' },
			{ name: 'rangeLow', label: 'Range Low', type: 'numberrange' },
			{ name: 'rangeHigh', label: 'Range High', type: 'numberrange' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' },
			{ name: 'source', label: 'Source', type: 'concept' }
		],
		observation: [
			{ name: 'conceptset', label: 'Observation Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Observation Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Observation', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'date', label: 'Observation Date', type: 'daterange' },
			{ name: 'observationType', label: 'Observation Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'valueAsNumber', label: 'Value as Number', type: 'numberrange' },
			{ name: 'valueAsString', label: 'Value as String', type: 'string' },
			{ name: 'valueAsConcept', label: 'Value as Concept', type: 'concept' },
			{ name: 'qualifierType', label: 'Qualifier Type', type: 'concept' },
			{ name: 'unitType', label: 'Unit Type', type: 'concept' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' }
		],
		observation_period: [
			{ name: 'first', label: 'First Period Only', type: 'checkbox' },
			{ name: 'startAge', label: 'Age at Period Start', type: 'numberrange' },
			{ name: 'endAge', label: 'Age at Period End', type: 'numberrange' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'length', label: 'Period Length', type: 'numberrange' }
		],
		procedure_occurrence: [
			{ name: 'conceptset', label: 'Procedure Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Procedure Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Procedure', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Procedure Date', type: 'daterange' },
			{ name: 'procedureType', label: 'Procedure Type', type: 'concept' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'modifierType', label: 'Modifier Type', type: 'concept' },
			{ name: 'quantity', label: 'Quantity', type: 'numberrange' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' }
		],
		specimen: [
			{ name: 'conceptset', label: 'Specimen Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Specimen Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Specimen Collection', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'date', label: 'Specimen Date', type: 'daterange' },
			{ name: 'specimenType', label: 'Specimen Type', type: 'concept' },
			{ name: 'quantity', label: 'Quantity', type: 'numberrange' },
			{ name: 'unitType', label: 'Unit Type', type: 'concept' },
			{ name: 'anatomicSiteType', label: 'Anatomic Site Type', type: 'concept' },
			{ name: 'diseaseStatus', label: 'Disease Status', type: 'concept' }
		],
		visit_occurrence: [
			{ name: 'conceptset', label: 'Visit Concept Set', type: 'conceptset' },
			{ name: 'first', label: 'First Visit Only', type: 'checkbox' },
			{ name: 'age', label: 'Age at Visit Start', type: 'numberrange' },
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'startDate', label: 'Start Date', type: 'daterange' },
			{ name: 'endDate', label: 'End Date', type: 'daterange' },
			{ name: 'visitType', label: 'Visit Type', type: 'concept' },
			{ name: 'length', label: 'Visit Length', type: 'numberrange' },
			{ name: 'source', label: 'Source', type: 'concept' },
			{ name: 'providerSpecialty', label: 'Provider Specialty', type: 'concept' },
			{ name: 'placeOfService', label: 'Place of Service', type: 'concept' }
		],
		demographic: [
			{ name: 'gender', label: 'Gender', type: 'concept' },
			{ name: 'raceType', label: 'Race', type: 'concept' },
			{ name: 'ethnicityType', label: 'Ethnicity', type: 'concept' }
		]
	};

	// 편집 관련 상태 변수
	let selectedDomainType = $state<DomainType | null>(null); // 선택된 도메인 타입
	let editingFilterIndex = $state<number | null>(null); // 편집할 필터 인덱스
	let editingGroupType = $state<'initialGroup' | 'comparisonGroup'>('initialGroup'); // 편집할 그룹 타입
	let editingContainerIndex = $state<number>(0); // 편집할 컨테이너 인덱스

	// 현재 편집중인 필터 속성 값
	let currentFilterValues = $state<FilterValues>({});

	// 임시 값 저장 (범위 입력 등을 위한)
	let tempRangeValues = $state<{[key: string]: {min?: string; max?: string; start?: string; end?: string}}>({});

	// 드래그 앤 드롭 관련 변수
	let draggedItem = $state(null);
	let draggedItemIndex = $state(null);
	let hoveredItemIndex = $state(null);

	// 컨테이너 드래그 앤 드롭 관련 변수
	let draggedContainerIndex = $state(null);
	let hoveredContainerIndex = $state(null);
	let draggedGroupType = $state(null);

	// 모달 관련 상태 변수
	let showConceptSetModal = $state(false);
	let showInclusionRuleModal = $state(false);
	let editingRuleIndex = $state(-1);

	// 필터 초기화 함수
	function resetFilterValues() {
		currentFilterValues = {};
		selectedDomainType = null;
		editingFilterIndex = null;
	}

	// 필터 생성 함수 - Filter 타입에 맞게 설정
	function createFilter() {
		if (!selectedDomainType) return;

		// 기본 필터 객체 생성 - Filter 타입에 맞게 타입 속성 설정
		const newFilter = {
			type: selectedDomainType
		};

		// 설정된 속성값 추가
		for (const key in currentFilterValues) {
			if (
				currentFilterValues[key] !== null &&
				currentFilterValues[key] !== undefined &&
				!(typeof currentFilterValues[key] === 'boolean' && currentFilterValues[key] === false) &&
				!Array.isArray(currentFilterValues[key])
			) {
				newFilter[key] = currentFilterValues[key];
			}
		}

		// 현재 편집중인 필터가 있는 경우 업데이트
		if (editingFilterIndex !== null) {
			cohortDefinition[editingGroupType].containers[editingContainerIndex].filters[
				editingFilterIndex
			] = newFilter;
		} else {
			// 새 필터 추가
			cohortDefinition[editingGroupType].containers[editingContainerIndex].filters.push(newFilter);
		}

		// 상태 초기화
		resetFilterValues();
	}

	// 필터 수정 함수
	function editFilter(groupType: 'initialGroup' | 'comparisonGroup', containerIndex: number, filterIndex: number) {
		editingGroupType = groupType;
		editingContainerIndex = containerIndex;
		editingFilterIndex = filterIndex;

		const filter = cohortDefinition[groupType].containers[containerIndex].filters[filterIndex] as Filter;
		selectedDomainType = filter.type;

		// 기존 값 로드
		currentFilterValues = { ...filter } as FilterValues;
		delete currentFilterValues.type; // type 속성 제외
	}

	// 필터 삭제 함수
	function removeFilter(groupType: 'initialGroup' | 'comparisonGroup', containerIndex: number, filterIndex: number) {
		cohortDefinition[groupType].containers[containerIndex].filters.splice(filterIndex, 1);
	}

	// 조건 타입 이름 표시 함수
	function getDomainTypeName(type) {
		const domainType = domainTypes.find((dt) => dt.type === type);
		return domainType ? domainType.name : type;
	}

	// 속성값 업데이트 함수
	function updateFilterValue(property, value) {
		currentFilterValues[property] = value;
	}

	// 숫자 범위 업데이트 함수 - NumberWithOperator 타입 적용
	function updateNumberRange(property, min, max) {
		// Operator<number> 형식으로 저장
		if (min !== null && min !== '' && max !== null && max !== '') {
			currentFilterValues[property] = {
				gte: Number(min),
				lte: Number(max)
			};
		} else if (min !== null && min !== '') {
			currentFilterValues[property] = {
				gte: Number(min)
			};
		} else if (max !== null && max !== '') {
			currentFilterValues[property] = {
				lte: Number(max)
			};
		} else {
			currentFilterValues[property] = null;
		}
	}

	// 날짜 범위 업데이트 함수 - DateWithOperator 타입 적용
	function updateDateRange(property, start, end) {
		// Operator<string> 형식으로 저장
		if (start && end) {
			currentFilterValues[property] = {
				gte: start,
				lte: end
			};
		} else if (start) {
			currentFilterValues[property] = {
				gte: start
			};
		} else if (end) {
			currentFilterValues[property] = {
				lte: end
			};
		} else {
			currentFilterValues[property] = null;
		}
	}

	// 문자열 연산자 업데이트 함수 - StringWithOperator 타입 적용
	function updateStringOperator(property, value, operator = 'eq') {
		if (!value) {
			currentFilterValues[property] = null;
			return;
		}

		// StringOperator 형식으로 저장
		const operatorObj = {};
		operatorObj[operator] = value;
		currentFilterValues[property] = operatorObj;
	}

	// 새 컨테이너 추가 함수 - SubsequentContainer 타입 적용
	function addContainer(groupType) {
		const containers = cohortDefinition[groupType].containers;
		const newContainer = {
			name: `Container ${containers.length + 1}`,
			filters: []
		};

		// 첫 번째가 아닌 컨테이너는 SubsequentContainer 타입으로 operator 필요
		if (containers.length > 0) {
			newContainer.operator = 'AND';
		}

		cohortDefinition[groupType].containers.push(newContainer);
	}

	// 컨테이너 삭제 함수
	function removeContainer(groupType, containerIndex) {
		// 첫 번째 컨테이너는 삭제 불가 (FirstContainer 타입)
		if (containerIndex === 0 && cohortDefinition[groupType].containers.length === 1) {
			return;
		}

		cohortDefinition[groupType].containers.splice(containerIndex, 1);
	}

	// 컨테이너 이름 변경 함수
	function updateContainerName(groupType, containerIndex, name) {
		cohortDefinition[groupType].containers[containerIndex].name = name;
	}

	// 컨테이너 연산자 변경 함수 - SubsequentContainer 타입의 operator 속성 업데이트
	function updateContainerOperator(groupType, containerIndex, operator) {
		if (containerIndex > 0) {
			// 첫 번째 컨테이너는 FirstContainer 타입으로 연산자가 없음
			cohortDefinition[groupType].containers[containerIndex].operator = operator;
		}
	}

	// 비교 그룹 토글 함수
	function toggleComparisonGroup() {
		if (cohortDefinition.comparisonGroup) {
			// 비교 그룹이 있으면 제거
			delete cohortDefinition.comparisonGroup;
		} else {
			// 비교 그룹이 없으면 추가
			cohortDefinition.comparisonGroup = {
				containers: [
					{
						name: 'Container 1',
						filters: []
					}
				]
			};
		}
	}

	// 컨셉셋 업데이트 함수
	function handleConceptSetUpdate(event: { detail: { conceptSets: ConceptSet[] } }) {
		const { conceptSets } = event.detail;
		cohortDefinition.conceptsets = conceptSets;
	}

	// 컨셉셋 선택 함수
	function selectConceptSet(id: Identifier) {
		if (!currentFilterValues.conceptset) {
			currentFilterValues = { ...currentFilterValues, conceptset: id };
		} else {
			currentFilterValues.conceptset = id;
		}
	}

	// 범위값 추출 함수
	function extractRangeValue(operatorObj, key) {
		if (!operatorObj) return '';
		return operatorObj[key] !== undefined ? operatorObj[key] : '';
	}

	// JSON 변환 함수
	function getCohortDefinitionJSON() {
		return JSON.stringify(cohortDefinition, null, 2);
	}

	// 속성값 표시 함수
	function displayPropertyValue(value: any, type?: string): string {
		if (value === null || value === undefined) return 'Not specified';

		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}

		if (typeof value === 'object') {
			// Operator 객체인 경우 범위 표시
			if (value.eq !== undefined) return `= ${value.eq}`;
			if (value.neq !== undefined) return `≠ ${value.neq}`;

			let result = '';
			if (value.gte !== undefined) result += `between ${value.gte}`;
			if (value.gt !== undefined) result += `> ${value.gt}`;
			if (
				(value.gte !== undefined || value.gt !== undefined) &&
				(value.lte !== undefined || value.lt !== undefined)
			)
				result += ' and ';
			if (value.lte !== undefined) result += `${value.lte}`;
			if (value.lt !== undefined) result += `< ${value.lt}`;

			// String Operator 객체인 경우
			if (value.startsWith !== undefined) result += `Starts with ${value.startsWith}`;
			if (value.endsWith !== undefined) result += `Ends with ${value.endsWith}`;
			if (value.contains !== undefined) result += `Contains ${value.contains}`;

			return result || JSON.stringify(value);
		}

		// 표준 개념 값 변환
		if (type === 'concept') {
			// 성별 개념
			if (value === '8507') return 'Male';
			if (value === '8532') return 'Female';
			if (value === '8521') return 'Unknown Gender';
			if (value === '8551') return 'Other Gender';

			// 인종 개념
			if (value === '8515') return 'Asian';
			if (value === '8516') return 'Black';
			if (value === '8527') return 'White';
			if (value === '8552') return 'Hispanic';
			if (value === '8522') return 'Native Hawaiian or Other Pacific Islander';
			if (value === '8657') return 'American Indian or Alaska Native';

			// 민족성 개념
			if (value === '38003563') return 'Hispanic';
			if (value === '38003564') return 'Not Hispanic';
			
			if (value === '0') return 'Unknown';
		}

		return value.toString();
	}

	// 컨테이너 순서 변경 함수
	function handleContainerReorder(groupType, draggedIndex, targetIndex) {
		if (draggedIndex === targetIndex) return;

		const containers = [...cohortDefinition[groupType].containers];

		// 첫 번째 컨테이너는 operator가 없으므로 특별 처리
		if (draggedIndex === 0 || targetIndex === 0) {
			// 첫 번째 컨테이너가 관련된 경우, operator 이동 처리 필요
			const temp = containers[draggedIndex];
			containers.splice(draggedIndex, 1);
			containers.splice(targetIndex, 0, temp);

			// operator 재설정
			if (containers[0].operator) {
				// 새 첫 번째 컨테이너에 operator가 있으면 제거 (FirstContainer 타입으로 변환)
				const firstOperator = containers[0].operator;
				delete containers[0].operator;

				// 원래 첫 번째였던 컨테이너가 이동했으면 operator 추가 (SubsequentContainer 타입으로 변환)
				if (draggedIndex === 0 && targetIndex > 0) {
					containers[1].operator = containers[1].operator || firstOperator || 'AND';
				}
			}
		} else {
			// 첫 번째 컨테이너가 아닌 경우 일반적인 순서 변경
			const temp = containers[draggedIndex];
			containers.splice(draggedIndex, 1);
			containers.splice(targetIndex, 0, temp);
		}

		// 모든 컨테이너에 operator가 있는지 확인하고 첫 번째 이외의 컨테이너에 없으면 추가
		for (let i = 1; i < containers.length; i++) {
			if (!containers[i].operator) {
				containers[i].operator = 'AND';
			}
		}

		// 첫 번째 컨테이너에 operator가 있으면 제거
		if (containers[0].operator) {
			delete containers[0].operator;
		}

		cohortDefinition[groupType].containers = containers;
	}

	// 표준 개념 값 정의
	const standardConcepts = {
		gender: [
			{ concept_id: '8507', concept_name: 'Male' },
			{ concept_id: '8532', concept_name: 'Female' },
			{ concept_id: '8521', concept_name: 'Unknown' },
			{ concept_id: '8551', concept_name: 'Other' }
		],
		race: [
			{ concept_id: '8515', concept_name: 'Asian' },
			{ concept_id: '8516', concept_name: 'Black' },
			{ concept_id: '8527', concept_name: 'White' },
			{ concept_id: '8552', concept_name: 'Hispanic' },
			{ concept_id: '8522', concept_name: 'Native Hawaiian or Other Pacific Islander' },
			{ concept_id: '8657', concept_name: 'American Indian or Alaska Native' },
			{ concept_id: '0', concept_name: 'Unknown' }
		],
		ethnicity: [
			{ concept_id: '38003563', concept_name: 'Hispanic' },
			{ concept_id: '38003564', concept_name: 'Not Hispanic' },
			{ concept_id: '0', concept_name: 'Unknown' }
		]
	};
</script>

<!-- Left Sidebar -->
<div
	class="fixed left-0 top-[60px] flex h-[calc(100vh-60px)] w-[200px] flex-col overflow-y-auto border-r border-gray-300 bg-gray-50"
>
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<h3 class="mb-3 text-sm font-bold text-gray-700">Initial Group</h3>
		{#if cohortDefinition.initialGroup.containers.length === 0}
			<p class="mb-2 ml-2 text-xs italic text-gray-500">No initial filters defined</p>
		{:else}
			{#each cohortDefinition.initialGroup.containers as container}
				<div class="mb-2 rounded-md bg-blue-50 px-2 py-1">
					<p class="text-xs font-medium text-blue-700">{container.name}</p>
				</div>
			{/each}
		{/if}
	</div>

	{#if cohortDefinition.comparisonGroup}
		<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
			<h3 class="mb-3 text-sm font-bold text-gray-700">Comparison Group</h3>
			{#if cohortDefinition.comparisonGroup.containers.length === 0}
				<p class="mb-2 ml-2 text-xs italic text-gray-500">No comparison filters defined</p>
			{:else}
				{#each cohortDefinition.comparisonGroup.containers as container}
					<div class="mb-2 rounded-md bg-blue-50 px-2 py-1">
						<p class="text-xs font-medium text-blue-700">{container.name}</p>
					</div>
				{/each}
			{/if}
		</div>
	{/if}

	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-sm font-bold text-gray-700">Concept Sets</h3>
			<button
				class="text-xs text-blue-600 hover:text-blue-800"
				on:click={() => (showConceptSetModal = true)}
			>
				Manage
			</button>
		</div>
		{#if cohortDefinition.conceptsets.length === 0}
			<p class="mb-2 ml-2 text-xs italic text-gray-500">No concept sets defined</p>
		{:else}
			{#each cohortDefinition.conceptsets as conceptSet}
				<div class="mb-2 rounded-md bg-purple-50 px-2 py-1">
					<p class="text-xs font-medium text-purple-700">{conceptSet.name}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Main Content Area -->
<div
	class="fixed left-[200px] top-[60px] h-[calc(100vh-60px)] w-[calc(100vw-600px)] overflow-y-auto"
>
	<div class="flex h-full">
		<!-- Main Panel -->
		<div class="flex flex-1 flex-col p-5">
			<div class="mb-8">
				<div class="flex items-center justify-between">
					<div class="w-2/3">
						<div class="group relative">
							<label
								for="cohortName"
								class="mb-1 block flex px-1 text-sm font-medium text-gray-700"
							>
								<svg
									class="h-4 w-4 text-gray-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
									/>
								</svg>
								Cohort Name
							</label>

							<div class="relative">
								<input
									type="text"
									id="cohortName"
									class="w-full rounded border-0 bg-transparent p-0 text-2xl font-bold text-gray-800 transition-colors duration-200 focus:ring-0 group-hover:bg-gray-50"
									bind:value={cohortName}
								/>
							</div>
						</div>
						<div class="group relative mt-4">
							<label
								for="cohortDescription"
								class="mb-1 block flex px-1 text-sm font-medium text-gray-700"
							>
								<svg
									class="h-4 w-4 text-gray-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
									/>
								</svg>
								Description
							</label>
							<div class="relative">
								<textarea
									id="cohortDescription"
									on:input={(e) => {
										const target = e.target;
										cohortDescription = target.value;
										target.style.height = 'auto';
										target.style.height = target.scrollHeight + 'px';
									}}
									class="w-full overflow-hidden rounded border-0 bg-transparent p-0 text-sm text-gray-600 transition-colors duration-200 focus:ring-0 group-hover:bg-gray-50"
									bind:value={cohortDescription}
									style="min-height: 1.5rem; height: auto; resize: none;"
								/>
							</div>
						</div>
					</div>

					<button
						class="relative flex items-center rounded-2xl px-4 py-2"
						on:click={() => (showCohortAIModal = true)}
					>
						<span
							class="animate-gradient-rotation absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
						></span>
						<span class="absolute inset-[3px] rounded-xl bg-white"></span>
						<span
							class="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-sm font-medium text-transparent"
							>use Cohort AI</span
						>
					</button>
				</div>
			</div>
			<!-- 
			<div class="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-800">Cohort Structure</h2>
					<div class="flex items-center gap-2">
						{#if cohortDefinition.comparisonGroup}
							<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
								<svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
									<circle cx="4" cy="4" r="3" />
								</svg>
								Comparison Mode
							</span>
							<button 
								class="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
								on:click={toggleComparisonGroup}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
								Remove Comparison
							</button>
						{:else}
							<button 
								class="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
								on:click={toggleComparisonGroup}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Add Comparison Group
							</button>
						{/if}
					</div>
				</div>
				{#if cohortDefinition.comparisonGroup}
					<div class="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
						<p><span class="font-medium">Comparison mode:</span> The Initial Group AND Comparison Group criteria must both be satisfied. Patients must meet conditions from both groups to be included in the final cohort.</p>
					</div>
				{/if}
			</div> -->

			<!-- Initial Group Section -->
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-800">Initial Group</h3>
					<button
						class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
						on:click={() => addContainer('initialGroup')}
					>
						Add Container
					</button>
				</div>

				<div class="space-y-6">
					{#each cohortDefinition.initialGroup.containers as container, containerIndex}
						<div
							class="cursor-move rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 {draggedContainerIndex ===
								containerIndex && draggedGroupType === 'initialGroup'
								? 'opacity-50'
								: ''} {hoveredContainerIndex === containerIndex &&
							draggedContainerIndex !== null &&
							draggedContainerIndex !== containerIndex &&
							draggedGroupType === 'initialGroup'
								? 'border-blue-400 bg-blue-50'
								: ''}"
							draggable="true"
							on:dragstart={() => {
								draggedContainerIndex = containerIndex;
								draggedGroupType = 'initialGroup';
							}}
							on:dragover|preventDefault={() => {
								hoveredContainerIndex = containerIndex;
							}}
							on:drop|preventDefault={() => {
								if (draggedGroupType === 'initialGroup') {
									handleContainerReorder(
										'initialGroup',
										draggedContainerIndex,
										hoveredContainerIndex
									);
								}
								draggedContainerIndex = null;
								hoveredContainerIndex = null;
								draggedGroupType = null;
							}}
						>
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center">
									{#if containerIndex > 0}
										<select
											class="mr-2 rounded border border-gray-300 bg-gray-50 px-2 py-1 pr-8 text-sm"
											value={container.operator}
											on:change={(e) =>
												updateContainerOperator('initialGroup', containerIndex, e.target.value)}
										>
											<option value="AND">AND</option>
											<option value="OR">OR</option>
											<option value="NOT">NOT</option>
										</select>
									{/if}
									<h4 class="flex items-center text-lg font-medium text-blue-600">
										<svg
											class="h-4 w-4 text-gray-400"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											/>
										</svg>
										<input
											id="containerName"
											type="text"
											class="w-full rounded border-0 bg-transparent p-0 text-lg font-medium text-blue-600 focus:ring-0  hover:bg-blue-50 transition-colors duration-200"
											value={container.name}
											on:change={(e) =>
												updateContainerName('initialGroup', containerIndex, e.target.value)}
										/>
									</h4>
								</div>
								<div class="flex space-x-2">
									<button
										class="text-sm text-blue-500 hover:text-blue-700"
										on:click={() => {
											editingGroupType = 'initialGroup';
											editingContainerIndex = containerIndex;
											selectedDomainType = null;
										}}
									>
										Add Filter
									</button>
									{#if containerIndex > 0 || cohortDefinition.initialGroup.containers.length > 1}
										<button
											class="text-sm text-red-500 hover:text-red-700"
											on:click={() => removeContainer('initialGroup', containerIndex)}
										>
											Remove
										</button>
									{/if}
								</div>
							</div>

							{#if container.filters.length === 0}
								<div
									class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-6"
								>
									<p class="text-gray-500">No filters added. Click "Add Filter" to add a filter.</p>
								</div>
							{:else}
								<div class="space-y-4">
									{#each container.filters as filter, filterIndex}
										<div class="rounded border border-gray-200 bg-gray-50 p-3">
											<div class="mb-2 flex items-center justify-between">
												<h5 class="text-base font-medium text-gray-700">
													{getDomainTypeName(filter.type)}
												</h5>
												<div class="flex space-x-2">
													<button
														class="text-xs text-blue-500 hover:text-blue-700"
														on:click={() => editFilter('initialGroup', containerIndex, filterIndex)}
													>
														Edit
													</button>
													<button
														class="text-xs text-red-500 hover:text-red-700"
														on:click={() =>
															removeFilter('initialGroup', containerIndex, filterIndex)}
													>
														Remove
													</button>
												</div>
											</div>

											<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
												{#each Object.entries(filter).filter(([key]) => key !== 'type') as [property, value]}
													<div>
														<span class="font-medium">{property}:</span>
														{displayPropertyValue(value, property === 'gender' || property === 'raceType' || property === 'ethnicityType' ? 'concept' : undefined)}
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Comparison Group Section -->
			{#if cohortDefinition.comparisonGroup}
				<div class="mb-6">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center">
							<h3 class="text-lg font-semibold text-gray-800">Comparison Group</h3>
							<span class="ml-3 text-xs text-gray-500"
								>Combined with Initial Group using AND logic</span
							>
						</div>
						<button
							class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
							on:click={() => addContainer('comparisonGroup')}
						>
							Add Container
						</button>
					</div>

					<div class="space-y-6">
						{#each cohortDefinition.comparisonGroup.containers as container, containerIndex}
							<div
								class="cursor-move rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 {draggedContainerIndex ===
									containerIndex && draggedGroupType === 'comparisonGroup'
									? 'opacity-50'
									: ''} {hoveredContainerIndex === containerIndex &&
								draggedContainerIndex !== null &&
								draggedContainerIndex !== containerIndex &&
								draggedGroupType === 'comparisonGroup'
									? 'border-blue-400 bg-blue-50'
									: ''}"
								draggable="true"
								on:dragstart={() => {
									draggedContainerIndex = containerIndex;
									draggedGroupType = 'comparisonGroup';
								}}
								on:dragover|preventDefault={() => {
									hoveredContainerIndex = containerIndex;
								}}
								on:drop|preventDefault={() => {
									if (draggedGroupType === 'comparisonGroup') {
										handleContainerReorder(
											'comparisonGroup',
											draggedContainerIndex,
											hoveredContainerIndex
										);
									}
									draggedContainerIndex = null;
									hoveredContainerIndex = null;
									draggedGroupType = null;
								}}
							>
								<div class="mb-4 flex items-center justify-between">
									<div class="flex items-center">
										{#if containerIndex > 0}
											<select
												class="mr-2 rounded border border-gray-300 bg-gray-50 px-2 py-1 pr-8 text-sm"
												value={container.operator}
												on:change={(e) =>
													updateContainerOperator(
														'comparisonGroup',
														containerIndex,
														e.target.value
													)}
											>
												<option value="AND">AND</option>
												<option value="OR">OR</option>
												<option value="NOT">NOT</option>
											</select>
										{/if}
										<h4 class="flex items-center text-lg font-medium text-blue-600">
											<svg
												class="h-4 w-4 text-gray-400"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
												/>
											</svg>
											<input
												type="text"
												class="w-full rounded border-0 bg-transparent p-0 text-lg font-medium text-blue-600 focus:ring-0 hover:bg-blue-50 transition-colors duration-200"
												value={container.name}
												on:change={(e) =>
													updateContainerName('comparisonGroup', containerIndex, e.target.value)}
											/>
										</h4>
									</div>
									<div class="flex space-x-2">
										<button
											class="text-sm text-blue-500 hover:text-blue-700"
											on:click={() => {
												editingGroupType = 'comparisonGroup';
												editingContainerIndex = containerIndex;
												selectedDomainType = null;
											}}
										>
											Add Filter
										</button>
										{#if containerIndex > 0 || cohortDefinition.comparisonGroup.containers.length > 1}
											<button
												class="text-sm text-red-500 hover:text-red-700"
												on:click={() => removeContainer('comparisonGroup', containerIndex)}
											>
												Remove
											</button>
										{/if}
									</div>
								</div>

								{#if container.filters.length === 0}
									<div
										class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-6"
									>
										<p class="text-gray-500">
											No filters added. Click "Add Filter" to add a filter.
										</p>
									</div>
								{:else}
									<div class="space-y-4">
										{#each container.filters as filter, filterIndex}
											<div class="rounded border border-gray-200 bg-gray-50 p-3">
												<div class="mb-2 flex items-center justify-between">
													<h5 class="text-base font-medium text-gray-700">
														{getDomainTypeName(filter.type)}
													</h5>
													<div class="flex space-x-2">
														<button
															class="text-xs text-blue-500 hover:text-blue-700"
															on:click={() =>
																editFilter('comparisonGroup', containerIndex, filterIndex)}
														>
															Edit
														</button>
														<button
															class="text-xs text-red-500 hover:text-red-700"
															on:click={() =>
																removeFilter('comparisonGroup', containerIndex, filterIndex)}
														>
															Remove
														</button>
													</div>
												</div>

												<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
													{#each Object.entries(filter).filter(([key]) => key !== 'type') as [property, value]}
														<div>
															<span class="font-medium">{property}:</span>
															{displayPropertyValue(value, property === 'gender' || property === 'raceType' || property === 'ethnicityType' ? 'concept' : undefined)}
														</div>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Cohort JSON display (for debugging) -->
			<div class="mb-6 rounded-lg border border-gray-200 p-4">
				<h3 class="mb-2 text-lg font-semibold text-gray-800">Cohort Definition JSON (Developer)</h3>
				<pre
					class="h-60 overflow-auto rounded-md bg-gray-100 p-2 text-xs">{getCohortDefinitionJSON()}</pre>
			</div>

			<div class="flex justify-center p-12">
				<button
					class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					Create Cohort
				</button>
			</div>
		</div>
	</div>
</div>
<div
	class="fixed right-0 top-[60px] h-[calc(100vh-60px)] w-[400px] overflow-y-auto border-l border-gray-300 bg-gray-50 p-5"
>
	{#if selectedDomainType === null}
		<div class="mb-4">
			<!-- Display context info based on the current editing state -->
			{#if editingGroupType && editingContainerIndex !== null}
				<h3 class="mb-2 text-xl font-bold text-gray-800">
					Add Filter to {editingGroupType === 'initialGroup' ? 'Initial Group' : 'Comparison Group'}
				</h3>
				<p class="mb-4 text-sm text-gray-600">
					Container: {cohortDefinition[editingGroupType].containers[editingContainerIndex].name}
				</p>
			{:else}
				<h3 class="mb-3 text-xl font-bold text-gray-800">Add Filter</h3>
				<p class="mb-4 text-sm text-gray-600">Select a domain type to add a filter.</p>
			{/if}
		</div>

		<div class="space-y-2">
			{#each domainTypes as domain}
				<button
					class="w-full rounded-md border border-blue-200 bg-white p-3 text-left transition-colors hover:bg-blue-50"
					on:click={() => (selectedDomainType = domain.type)}
				>
					<div class="flex items-center justify-start">
						<span class="font-medium text-blue-600">{domain.name}</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">{domain.description}</p>
				</button>
			{/each}
		</div>
	{:else}
		<!-- Domain Type Filter Editing -->
		<div class="mb-4">
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-bold text-gray-800">
					{getDomainTypeName(selectedDomainType)}
				</h3>
				<button
					class="text-sm text-gray-500 hover:text-gray-700"
					on:click={() => {
						selectedDomainType = null;
						resetFilterValues();
					}}
				>
					Cancel
				</button>
			</div>
			<p class="mb-4 text-sm text-gray-600">Configure filter properties.</p>
		</div>

		<div class="mb-6 space-y-4">
			{#if domainProperties[selectedDomainType]}
				{#each domainProperties[selectedDomainType] as property}
					<!-- Property input fields by type -->
					<div class="mb-3">
						<label class="mb-1 block text-sm font-medium text-gray-700">
							{property.label}
						</label>

						{#if property.type === 'checkbox'}
							<div class="flex items-center">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-gray-300 text-blue-600"
									checked={currentFilterValues[property.name] === true}
									on:change={(e) => updateFilterValue(property.name, e.target.checked)}
								/>
								<span class="ml-2 text-sm text-gray-600">
									{property.name === 'first'
										? 'Limit to first occurrence'
										: property.name === 'abnormal'
											? 'Abnormal result only'
											: ''}
								</span>
							</div>
						{:else if property.type === 'conceptset'}
							<select
								class="w-full rounded-md border border-gray-300 p-2 text-sm"
								value={currentFilterValues[property.name]?.toString() || ''}
								on:change={(e) => {
									const value = e.target?.value === '' ? undefined : e.target?.value;
									updateFilterValue(property.name, value);
								}}
							>
								<option value="">Any</option>
								{#each cohortDefinition.conceptsets as conceptSet}
									<option value={conceptSet.conceptset_id}
										>{conceptSet.name || `Concept Set ${conceptSet.conceptset_id}`}</option
									>
								{/each}
							</select>
						{:else if property.type === 'concept'}
							<div class="flex space-x-2">
								<select
									class="w-full rounded-md border border-gray-300 p-2 text-sm"
									value={currentFilterValues[property.name] || ''}
									on:change={(e) => {
										const value = e.target?.value === '' ? undefined : e.target?.value;
										updateFilterValue(property.name, value);
									}}
								>
									<option value="">Any</option>
									{#if property.name === 'gender'}
										<!-- 성별은 표준화된 값으로 고정 -->
										{#each standardConcepts.gender as concept}
											<option value={concept.concept_id}>{concept.concept_name}</option>
										{/each}
									{:else if property.name === 'raceType'}
										<!-- 인종은 표준화된 값으로 고정 -->
										{#each standardConcepts.race as concept}
											<option value={concept.concept_id}>{concept.concept_name}</option>
										{/each}
									{:else if property.name === 'ethnicityType'}
										<!-- 민족성은 표준화된 값으로 고정 -->
										{#each standardConcepts.ethnicity as concept}
											<option value={concept.concept_id}>{concept.concept_name}</option>
										{/each}
									{:else}
										<!-- 다른 개념 타입은 사용자가 정의한 컨셉셋에서 가져옴 -->
										{#each cohortDefinition.conceptsets as conceptSet}
											{#if conceptSet.expression?.items}
												{#each conceptSet.expression.items as item}
													<option value={item.concept.concept_id}>
														{item.concept.concept_name} ({conceptSet.name})
													</option>
												{/each}
											{/if}
										{/each}
										{#if cohortDefinition.conceptsets.length === 0 || cohortDefinition.conceptsets.every((set) => !set.expression?.items || set.expression.items.length === 0)}
											<option value="" disabled
												>No concepts available - Define them in Concept Sets</option
											>
										{/if}
									{/if}
								</select>
								{#if !['gender', 'raceType', 'ethnicityType'].includes(property.name)}
									<button
										class="rounded border border-blue-300 bg-blue-100 px-2 py-1 text-sm text-blue-700 hover:bg-blue-200"
										on:click={() => (showConceptSetModal = true)}
										title="Manage Concept Sets"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 6v6m0 0v6m0-6h6m-6 0H6"
											/>
										</svg>
									</button>
								{/if}
							</div>
						{:else if property.type === 'numberrange'}
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									placeholder="Min"
									class="w-20 rounded-md border border-gray-300 p-1 text-sm"
									value={extractRangeValue(currentFilterValues[property.name], 'gte')}
									on:change={(e) => {
										if (!tempRangeValues[property.name]) tempRangeValues[property.name] = {};
										tempRangeValues[property.name].min = e.target.value;
										updateNumberRange(
											property.name,
											tempRangeValues[property.name].min,
											tempRangeValues[property.name].max
										);
									}}
								/>
								<span class="text-gray-600">to</span>
								<input
									type="number"
									min="0"
									placeholder="Max"
									class="w-20 rounded-md border border-gray-300 p-1 text-sm"
									value={extractRangeValue(currentFilterValues[property.name], 'lte')}
									on:change={(e) => {
										if (!tempRangeValues[property.name]) tempRangeValues[property.name] = {};
										tempRangeValues[property.name].max = e.target.value;
										updateNumberRange(
											property.name,
											tempRangeValues[property.name].min,
											tempRangeValues[property.name].max
										);
									}}
								/>
								<span class="text-sm text-gray-600">
									{property.name === 'age' ||
									property.name === 'startAge' ||
									property.name === 'endAge'
										? 'years'
										: property.name.includes('length')
											? 'days'
											: ''}
								</span>
							</div>
						{:else if property.type === 'daterange'}
							<div class="flex items-center gap-2">
								<input
									type="date"
									class="rounded-md border border-gray-300 p-1 text-sm"
									value={extractRangeValue(currentFilterValues[property.name], 'gte')}
									on:change={(e) => {
										if (!tempRangeValues[property.name]) tempRangeValues[property.name] = {};
										tempRangeValues[property.name].start = e.target.value;
										updateDateRange(
											property.name,
											tempRangeValues[property.name].start,
											tempRangeValues[property.name].end
										);
									}}
								/>
								<span class="text-gray-600">to</span>
								<input
									type="date"
									class="rounded-md border border-gray-300 p-1 text-sm"
									value={extractRangeValue(currentFilterValues[property.name], 'lte')}
									on:change={(e) => {
										if (!tempRangeValues[property.name]) tempRangeValues[property.name] = {};
										tempRangeValues[property.name].end = e.target.value;
										updateDateRange(
											property.name,
											tempRangeValues[property.name].start,
											tempRangeValues[property.name].end
										);
									}}
								/>
							</div>
						{:else if property.type === 'string'}
							<div class="flex items-center gap-2">
								<select
									class="rounded-md border border-gray-300 p-1 text-sm"
									on:change={(e) => {
										const value =
											currentFilterValues[property.name]?.eq ||
											currentFilterValues[property.name]?.contains ||
											currentFilterValues[property.name]?.startsWith ||
											currentFilterValues[property.name]?.endsWith ||
											'';
										updateStringOperator(property.name, value, e.target.value);
									}}
								>
									<option value="eq">equals</option>
									<option value="contains">contains</option>
									<option value="startsWith">starts with</option>
									<option value="endsWith">ends with</option>
								</select>
								<input
									type="text"
									class="flex-1 rounded-md border border-gray-300 p-1 text-sm"
									value={currentFilterValues[property.name]?.eq ||
										currentFilterValues[property.name]?.contains ||
										currentFilterValues[property.name]?.startsWith ||
										currentFilterValues[property.name]?.endsWith ||
										''}
									on:change={(e) => {
										const operator =
											currentFilterValues[property.name]?.eq !== undefined
												? 'eq'
												: currentFilterValues[property.name]?.contains !== undefined
													? 'contains'
													: currentFilterValues[property.name]?.startsWith !== undefined
														? 'startsWith'
														: currentFilterValues[property.name]?.endsWith !== undefined
															? 'endsWith'
															: 'eq';
										updateStringOperator(property.name, e.target.value, operator);
									}}
								/>
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<p class="italic text-gray-600">No properties available for this domain type.</p>
			{/if}
		</div>

		<div class="mt-6 flex justify-end">
			<button
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				on:click={createFilter}
			>
				{editingFilterIndex !== null ? 'Update' : 'Add'} Filter
			</button>
		</div>
	{/if}
</div>

<!-- Concept Set Management Modal -->
<ConceptSetModal
	bind:show={showConceptSetModal}
	conceptSets={cohortDefinition.conceptsets}
	on:update={handleConceptSetUpdate}
	on:close={() => (showConceptSetModal = false)}
/>

<!-- Cohort AI Modal -->
<CohortAIModal
	bind:show={showCohortAIModal}
	onClose={() => (showCohortAIModal = false)}
	onSubmit={handleCohortAISubmit}
/>

<style>
	@keyframes gradient-rotate {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	:global(.animate-gradient-rotation) {
		background-size: 200% 200%;
		animation: gradient-rotate 3s ease infinite;
	}
</style>
