<!-- 
	New Cohort Builder Implementation - Based on types.ts specification
-->

<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ConceptSetModal from './components/ConceptSetModal.svelte';
	import ChartTypeModal from './components/ChartTypeModal.svelte';

	// 연산자 컴포넌트 가져오기
	import NumberOperator from '$lib/components/operators/NumberOperator.svelte';
	import StringOperator from '$lib/components/operators/StringOperator.svelte';
	import DateOperator from '$lib/components/operators/DateOperator.svelte';
	import IdentifierOperator from '$lib/components/operators/IdentifierOperator.svelte';
	import ConceptSelectorWrapper from '$lib/components/operators/ConceptSelectorWrapper.svelte';

	const { data } = $props();

	const { statistics_id } = data;
	console.log(statistics_id);

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

	// type.ts에 맞게 수정된 Concept 인터페이스
	interface Concept {
		concept_id: Identifier;
		concept_name: string;
		domain_id: string;
		vocabulary_id: string;
		concept_class_id: string;
		standard_concept: string;
		concept_code: string;
		valid_start_date: string;
		valid_end_date: string;
		invalid_reason?: string;

		isExcluded?: boolean;
		includeDescendants?: boolean;
		includeMapped?: boolean;
	}

	// type.ts에 맞게 수정된 ConceptSet 인터페이스
	interface ConceptSet {
		conceptset_id: Identifier;
		name: string;
		items: Concept[]; // expression.items.concept에서 직접 items로 변경
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

	interface BoxPlotCountBy {
		concept?: Identifier;
		age?: NumberWithOperator;
		date?: DateWithOperator;
		value?: NumberWithOperator;
	}

	let chartName = $state('Chart name');
	let chartDescription = $state('Chart Description');

	let groups = $state([
		{
			name: 'Group 1',
			definition: {
				conceptsets: [],
				initialGroup: {
					containers: [
						{
							name: 'filters',
							filters: []
						}
					]
				}
			}
		}
	]);
	let conceptsets = $state<ConceptSet[]>([]);
	let chartType = $state('bar');
	// Make sure these variables are defined in your state:
	let countBy = $state<BoxPlotCountBy>({
		concept: undefined,
		age: undefined,
		date: undefined,
		value: undefined
	});

	// Function to update Count By values
	function updateCountByValue(property, value) {
		currentCountByValues[property] = value;
	}

	async function createChart() {


		// concept sets 연결
		groups.forEach(group => {
			group.definition.conceptsets = conceptsets;
		});

		// 차트 생성
		await fetch(`https://bento.kookm.in/api/statistics/${statistics_id}/chart`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: chartName,
				description: chartDescription,
				type: chartType,
				groups: groups,
				countBy: currentCountByValues
			})
		});

		// 차트 생성 후 페이지 이동
		goto(`/custom-chart/${statistics_id}`);
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
			description:
				'Find patients based on demographic information like gender, race, and ethnicity.'
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
	let editingGroupIndex = $state<number | null>(0); // 편집할 그룹 인덱스
	let editingDataIndex = $state<number | null>(0); // 편집할 데이터 인덱스
	let editingCountBy = $state<boolean>(false); // Count By 편집 모드

	// 현재 편집중인 필터 속성 값
	let currentFilterValues = $state<FilterValues>({});

	// 현재 편집중인 Count By 속성 값
	let currentCountByValues = $state<BoxPlotCountBy>({
		concept: undefined,
		age: undefined,
		date: undefined,
		value: undefined
	});

	// 컨테이너 드래그 앤 드롭 관련 변수
	let draggedContainerIndex = $state(null);
	let hoveredContainerIndex = $state(null);

	// 모달 관련 상태 변수
	let showConceptSetModal = $state(false);
	let showChartTypeModal = $state(true);

	function onGroupNameChange(groupIndex, name) {
		groups[groupIndex].name = name;
	}

	function onAddFilter(groupIndex) {
		console.log(groupIndex);
		editingGroupIndex = groupIndex;
		editingDataIndex = null;
		selectedDomainType = null;
	}

	function onAddData(groupIndex) {
		editingGroupIndex = null;
		editingDataIndex = groupIndex;
		selectedDomainType = null;
	}

	function onGroupRemove(groupIndex) {
		groups.splice(groupIndex, 1);
	}

	function onFilterRemove(groupIndex, filterIndex) {
		groups[groupIndex].definition.initialGroup.containers[0].filters.splice(filterIndex, 1);
	}

	function onDataRemove(groupIndex) {
		groups[groupIndex].definition.data = null;
	}

	function editDataFilter(groupIndex) {
		editingGroupIndex = null;
		editingDataIndex = groupIndex;

		const filter = groups[groupIndex].definition.data as Filter;
		selectedDomainType = filter.type;

		// 기존 값 로드
		currentFilterValues = { ...filter } as FilterValues;
		delete currentFilterValues.type; // type 속성 제외
	}

	// 필터 초기화 함수
	function resetFilterValues() {
		currentFilterValues = {};
		selectedDomainType = null;
		editingFilterIndex = null;
		editingDataIndex = null;
		editingCountBy = false;
		if (editingGroupIndex === null) {
			editingGroupIndex = 0;
		}
	}

	// Count By 설정 저장 함수
	function saveCountBySettings() {
		countBy = { ...currentCountByValues };
		resetFilterValues();
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
		console.log(editingGroupIndex);
		console.log(groups[editingGroupIndex]);

		if (editingGroupIndex === null) {
			groups[editingDataIndex].definition.data = newFilter;
		} else {
			// 현재 편집중인 필터가 있는 경우 업데이트
			if (editingFilterIndex !== null) {
				groups[editingGroupIndex].definition.initialGroup.containers[0].filters[
					editingFilterIndex
				] = newFilter;
			} else {
				// 새 필터 추가
				groups[editingGroupIndex].definition.initialGroup.containers[0].filters.push(newFilter);
			}
		}

		// 상태 초기화
		resetFilterValues();
	}

	// 필터 수정 함수
	function editFilter(groupIndex: number, filterIndex: number) {
		editingGroupIndex = groupIndex;
		editingFilterIndex = filterIndex;

		const filter = groups[groupIndex].definition.initialGroup.containers[0].filters[
			filterIndex
		] as Filter;
		selectedDomainType = filter.type;

		// 기존 값 로드
		currentFilterValues = { ...filter } as FilterValues;
		delete currentFilterValues.type; // type 속성 제외
	}

	// 필터 삭제 함수
	function removeFilter(groupIndex: number, filterIndex: number) {
		groups[groupIndex].definition.initialGroup.containers[0].filters.splice(filterIndex, 1);
	}

	function removeDataFilter(groupIndex: number) {
		groups[groupIndex].definition.data = null;
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

	// 새 컨테이너 추가 함수 - SubsequentContainer 타입 적용
	function addGroup() {
		const newGroup = {
			name: `Group ${groups.length + 1}`,
			definition: {
				initialGroup: {
					containers: [
						{
							name: 'filters',
							filters: []
						}
					]
				}
			}
		};

		groups.push(newGroup);
		groups = groups;
	}

	// 컨셉셋 업데이트 함수
	function handleConceptSetUpdate(event: { detail: { conceptSets: ConceptSet[] } }) {
		const { conceptSets } = event.detail;
		conceptsets = conceptSets;
	}

	// 차트 타입 업데이트 함수
	function handleChartTypeUpdate(event: { detail: { chartType: string } }) {
		const { chartType: newChartType } = event.detail;
		chartType = newChartType;
	}

	// 컨셉셋 선택 함수
	function selectConceptSet(id: Identifier) {
		if (!currentFilterValues.conceptset) {
			currentFilterValues = { ...currentFilterValues, conceptset: id };
		} else {
			currentFilterValues.conceptset = id;
		}
	}

	// 연산자 타입 정의
	type OperatorType = {
		eq?: string | string[];
		neq?: string | string[];
		gt?: string | number;
		gte?: string | number;
		lt?: string | number;
		lte?: string | number;
		startsWith?: string;
		endsWith?: string;
		contains?: string;
		[key: string]: string | string[] | number | undefined;
	};

	// 연산자 표시 설정
	const operatorDisplayConfig = {
		eq: { symbol: '=', label: 'Equal to' },
		neq: { symbol: '≠', label: 'Not equal to' },
		gt: { symbol: '>', label: 'Greater than' },
		gte: { symbol: '≥', label: 'Greater than or equal to' },
		lt: { symbol: '<', label: 'Less than' },
		lte: { symbol: '≤', label: 'Less than or equal to' },
		startsWith: { symbol: 'starts with', label: 'Starts with' },
		endsWith: { symbol: 'ends with', label: 'Ends with' },
		contains: { symbol: 'contains', label: 'Contains' }
	};

	// 속성값 표시 함수
	function displayPropertyValue(value: any, type?: string): string {
		if (value === null || value === undefined) return 'Not specified';

		// Boolean 값 처리
		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}

		// 객체 처리 (Operator 타입)
		if (typeof value === 'object') {
			const parts: string[] = [];

			// 범위 연산자 처리
			const rangeOperators = ['gte', 'gt', 'lte', 'lt'];
			const hasRangeStart = value.gte !== undefined || value.gt !== undefined;
			const hasRangeEnd = value.lte !== undefined || value.lt !== undefined;

			if (hasRangeStart || hasRangeEnd) {
				if (hasRangeStart) {
					const startOp = value.gte !== undefined ? 'gte' : 'gt';
					parts.push(
						`${operatorDisplayConfig[startOp].label} ${formatValue(value[startOp], type)}`
					);
				}

				if (hasRangeEnd) {
					const endOp = value.lte !== undefined ? 'lte' : 'lt';
					parts.push(`${operatorDisplayConfig[endOp].label} ${formatValue(value[endOp], type)}`);
				}
			}

			// 문자열 연산자 처리
			const stringOperators = ['startsWith', 'endsWith', 'contains'];
			for (const op of stringOperators) {
				if (value[op] !== undefined) {
					parts.push(`${operatorDisplayConfig[op].label} "${value[op]}"`);
				}
			}

			// 동등성 연산자 처리
			const equalityOperators = ['eq', 'neq'];
			for (const op of equalityOperators) {
				if (value[op] !== undefined) {
					const opValue = value[op];
					if (Array.isArray(opValue)) {
						// 다중 값 처리
						const formattedValues = opValue.map((v) => formatValue(v, type));
						parts.push(`${operatorDisplayConfig[op].label} (${formattedValues.join(', ')})`);
					} else {
						// 단일 값 처리
						parts.push(`${operatorDisplayConfig[op].label} ${formatValue(opValue, type)}`);
					}
				}
			}

			return parts.join('\n') || JSON.stringify(value);
		}

		// 단일 값 처리
		return formatValue(value, type);
	}

	// 값 포맷팅 함수
	function formatValue(value: any, type?: string): string {
		// 개념 또는 개념 세트 타입 처리
		if (type === 'concept' || type === 'conceptset') {
			if (Array.isArray(value)) {
				// 다중 개념 ID 처리
				return value
					.map((id) => {
						const concept = findConceptById(id);
						return concept ? concept.name : id;
					})
					.join(', ');
			} else {
				// 단일 개념 ID 처리
				const concept = findConceptById(value);
				return concept ? concept.name : value.toString();
			}
		}

		// 날짜 타입 처리
		if (type === 'date') {
			return new Date(value).toLocaleDateString();
		}

		// 숫자 타입 처리
		if (typeof value === 'number') {
			return value.toLocaleString();
		}

		// 기본 문자열 처리
		return value.toString();
	}

	// 개념 ID로 개념 찾기
	function findConceptById(conceptId: string): { id: string; name: string } | undefined {
		for (const conceptSet of cohortDefinition.conceptsets) {
			for (const item of conceptSet.items) {
				if (item.concept_id === conceptId) {
					return {
						id: item.concept_id,
						name: item.concept_name
					};
				}
			}
		}
		return undefined;
	}

	// 컨테이너 순서 변경 함수
	function handleContainerReorder(draggedIndex, targetIndex) {
		if (draggedIndex === targetIndex) return;

		const groups_temp = [...groups];

		// 첫 번째 컨테이너가 아닌 경우 일반적인 순서 변경
		const temp = groups_temp[draggedIndex];
		groups_temp.splice(draggedIndex, 1);
		groups_temp.splice(targetIndex, 0, temp);

		groups = groups_temp;
	}

	// 개념 집합에서 특정 도메인의 개념들만 필터링하는 함수
	function getConceptsByDomain(domainId: string): { id: string; name: string }[] {
		return cohortDefinition.conceptsets.flatMap((cs) =>
			cs.items
				.filter((item) => item.domain_id === domainId)
				.map((item) => ({
					id: item.concept_id,
					name: item.concept_name
				}))
		);
	}

	// 특정 컨셉셋 ID의 개념들을 가져오는 함수
	function getConceptsBySetId(conceptsetId: string): { id: string; name: string }[] {
		const conceptSet = cohortDefinition.conceptsets.find((cs) => cs.conceptset_id === conceptsetId);
		if (!conceptSet) return [];

		return conceptSet.items.map((item) => ({
			id: item.concept_id,
			name: item.concept_name
		}));
	}
</script>

<!-- Left Sidebar -->
<div
	class="fixed left-0 top-[60px] flex h-[calc(100vh-60px)] w-[200px] flex-col overflow-y-auto border-r border-gray-300 bg-gray-50"
>
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<h3 class="mb-3 text-sm font-bold text-gray-700">Groups</h3>
		{#if groups.length === 0}
			<p class="mb-2 ml-2 text-xs italic text-gray-500">No groups defined</p>
		{:else}
			{#each groups as group}
				<div class="mb-2 rounded-md bg-blue-50 px-2 py-1">
					<p class="text-xs font-medium text-blue-700">{group.name}</p>
				</div>
			{/each}
		{/if}
	</div>
	<div class="flex w-full flex-col border-b border-gray-300 px-2 py-3">
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-sm font-bold text-gray-700">Chart Type</h3>
			<button
				class="text-xs text-blue-600 hover:text-blue-800"
				on:click={() => (showChartTypeModal = true)}
			>
				Manage
			</button>
		</div>
		<p class="mb-2 ml-2 text-sm font-bold text-gray-700">
			{chartType === 'bar' ? 'Bar Chart' : 'Box Plot'}
		</p>
		<div class="px-1">
			<!-- Simple chart type visual indicator -->
			{#if chartType === 'bar'}
				<svg width="100%" height="30" viewBox="0 0 100 30" class="mx-auto opacity-70">
					<rect x="10" y="5" width="10" height="20" fill="#4B96FF" />
					<rect x="30" y="10" width="10" height="15" fill="#4B96FF" />
					<rect x="50" y="8" width="10" height="17" fill="#4B96FF" />
					<rect x="70" y="12" width="10" height="13" fill="#4B96FF" />
				</svg>
			{:else}
				<svg width="100%" height="30" viewBox="0 0 100 30" class="mx-auto opacity-70">
					<line x1="20" y1="5" x2="20" y2="25" stroke="#4B96FF" stroke-width="1" />
					<rect x="15" y="10" width="10" height="10" fill="#E5EFFF" stroke="#4B96FF" />
					<line x1="15" y1="15" x2="25" y2="15" stroke="#4B96FF" stroke-width="2" />
					<line x1="10" y1="5" x2="30" y2="5" stroke="#4B96FF" stroke-width="1" />
					<line x1="10" y1="25" x2="30" y2="25" stroke="#4B96FF" stroke-width="1" />

					<line x1="60" y1="5" x2="60" y2="25" stroke="#4B96FF" stroke-width="1" />
					<rect x="55" y="8" width="10" height="14" fill="#E5EFFF" stroke="#4B96FF" />
					<line x1="55" y1="15" x2="65" y2="15" stroke="#4B96FF" stroke-width="2" />
					<line x1="50" y1="5" x2="70" y2="5" stroke="#4B96FF" stroke-width="1" />
					<line x1="50" y1="25" x2="70" y2="25" stroke="#4B96FF" stroke-width="1" />
				</svg>
			{/if}
		</div>
	</div>
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
		{#if conceptsets.length === 0}
			<p class="mb-2 ml-2 text-xs italic text-gray-500">No concept sets defined</p>
		{:else}
			{#each conceptsets as conceptset}
				<div class="mb-2 rounded-md bg-purple-50 px-2 py-1">
					<p class="text-xs font-medium text-purple-700">{conceptset.name}</p>
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
							<label for="chartName" class="mb-1 block flex px-1 text-sm font-medium text-gray-700">
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
								Chart Name
							</label>

							<div class="relative">
								<input
									type="text"
									id="chartName"
									class="w-full rounded border-0 bg-transparent p-0 text-2xl font-bold text-gray-800 transition-colors duration-200 focus:ring-0 group-hover:bg-gray-50"
									bind:value={chartName}
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
									id="chartDescription"
									on:input={(e) => {
										const target = e.target;
										chartDescription = target.value;
										target.style.height = 'auto';
										target.style.height = target.scrollHeight + 'px';
									}}
									class="w-full overflow-hidden rounded border-0 bg-transparent p-0 text-sm text-gray-600 transition-colors duration-200 focus:ring-0 group-hover:bg-gray-50"
									bind:value={chartDescription}
									style="min-height: 1.5rem; height: auto; resize: none;"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			{#if chartType === 'boxplot'}
				<div class="mb-6">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-800">Count By (Y-axis)</h3>
						<div>
							<button
								on:click={() => {
									editingGroupIndex = null;
									editingDataIndex = null;
									editingCountBy = true;
									selectedDomainType = null;
								}}
								class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
							>
								Add Count By
							</button>
						</div>
					</div>

					{#if countBy.concept || countBy.age || countBy.date || countBy.value}
						<div class="rounded border border-gray-200 bg-gray-50 p-3">
							<div class="mb-2 flex items-center justify-between">
								<h5 class="text-base font-medium text-gray-700">Count By Settings</h5>
								<div class="flex space-x-2">
									<button
										class="text-xs text-blue-500 hover:text-blue-700"
										on:click={() => {
											editingGroupIndex = null;
											editingDataIndex = null;
											editingCountBy = true;
											selectedDomainType = null;
											currentCountByValues = { ...countBy };
										}}
									>
										Edit
									</button>
									<button
										class="text-xs text-red-500 hover:text-red-700"
										on:click={() => {
											countBy = {
												concept: undefined,
												age: undefined,
												date: undefined,
												value: undefined
											};
										}}
									>
										Remove
									</button>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
								{#each Object.entries(countBy).filter(([key, value]) => value !== undefined) as [property, value]}
									<div>
										<span class="font-medium">{property}:</span>
										{displayPropertyValue(value, property === 'concept' ? 'concept' : undefined)}
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div
							class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-6"
						>
							<p class="text-gray-500">
								No Count By settings added. Click "Add Count By" to configure.
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Initial Group Section -->
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-800">Groups</h3>
					<button
						on:click={addGroup}
						class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
					>
						Add Group
					</button>
				</div>

				<div class="space-y-6">
					{#each groups as group, containerIndex}
						<div
							class="cursor-move rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 {draggedContainerIndex ===
							containerIndex
								? 'opacity-50'
								: ''} {hoveredContainerIndex === containerIndex &&
							draggedContainerIndex !== null &&
							draggedContainerIndex !== containerIndex
								? 'border-blue-400 bg-blue-50'
								: ''}"
							draggable="true"
							on:dragstart={() => {
								draggedContainerIndex = containerIndex;
							}}
							on:dragover|preventDefault={() => {
								hoveredContainerIndex = containerIndex;
							}}
							on:drop|preventDefault={() => {
								handleContainerReorder(draggedContainerIndex, hoveredContainerIndex);
								draggedContainerIndex = null;
								hoveredContainerIndex = null;
							}}
						>
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center">
									<div>
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
												class="w-full rounded border-0 bg-transparent p-0 text-lg font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 focus:ring-0"
												value={group.name}
												on:change={(e) => onGroupNameChange(containerIndex, e.target.value)}
											/>
										</h4>
									</div>
								</div>
								<div class="flex space-x-2">
									<button
										class="text-sm text-blue-500 hover:text-blue-700"
										on:click={() => onAddFilter(containerIndex)}
									>
										Add Filter
									</button>
									{#if group.definition.data !== undefined}
										<button
											class="text-sm text-blue-500 hover:text-blue-700"
											on:click={() => onAddData(containerIndex)}
										>
											Add Data
										</button>
									{/if}
									{#if groups.length > 1}
										<button
											class="text-sm text-red-500 hover:text-red-700"
											on:click={() => onGroupRemove(containerIndex)}
										>
											Remove
										</button>
									{/if}
								</div>
							</div>

							<p class="text-sm font-bold text-gray-700">Filters</p>
							{#if group.definition.initialGroup.containers[0].filters.length === 0}
								<div
									class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-6"
								>
									<p class="text-gray-500">No filters added. Click "Add Filter" to add a filter.</p>
								</div>
							{:else}
								<div class="space-y-4">
									{#each group.definition.initialGroup.containers[0].filters as filter, filterIndex}
										<div class="rounded border border-gray-200 bg-gray-50 p-3">
											<div class="mb-2 flex items-center justify-between">
												<h5 class="text-base font-medium text-gray-700">
													{getDomainTypeName(filter.type)}
												</h5>
												<div class="flex space-x-2">
													<button
														class="text-xs text-blue-500 hover:text-blue-700"
														on:click={() => editFilter(containerIndex, filterIndex)}
													>
														Edit
													</button>
													<button
														class="text-xs text-red-500 hover:text-red-700"
														on:click={() => removeFilter(containerIndex, filterIndex)}
													>
														Remove
													</button>
												</div>
											</div>

											<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
												{#each Object.entries(filter).filter(([key]) => key !== 'type') as [property, value]}
													<div>
														<span class="font-medium">{property}:</span>
														{displayPropertyValue(
															value,
															property === 'gender' ||
																property === 'raceType' ||
																property === 'ethnicityType'
																? 'concept'
																: undefined
														)}
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							{/if}

							{#if chartType === 'bar'}
								<div class="my-2 flex items-center space-x-4">
									<p class="text-sm font-bold text-gray-700">Count</p>
									<div class="flex items-center space-x-2">
										<input
											type="radio"
											id="data-{containerIndex}"
											value="data"
											on:click={() => (group.definition.data = null)}
											checked={group.definition.data !== undefined}
										/>
										<label for="data-{containerIndex}">number of data</label>
										<input
											type="radio"
											id="patient-{containerIndex}"
											value="patient"
											on:click={() => (group.definition.data = undefined)}
											checked={group.definition.data === undefined}
										/>
										<label for="patient-{containerIndex}">number of patients</label>
									</div>
								</div>
								{#if group.definition.data !== undefined}
									<p class="text-sm font-bold text-gray-700">Data</p>

									{#if group.definition.data === null}
										<div
											class="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-6"
										>
											<p class="text-gray-500">No data added. Click "Add Data" to add a data.</p>
										</div>
									{:else}
										<div class="space-y-4">
											<div class="rounded border border-gray-200 bg-gray-50 p-3">
												<div class="mb-2 flex items-center justify-between">
													<h5 class="text-base font-medium text-gray-700">
														{getDomainTypeName(group.definition.data.type)}
													</h5>
													<div class="flex space-x-2">
														<button
															class="text-xs text-blue-500 hover:text-blue-700"
															on:click={() => editDataFilter(containerIndex)}
														>
															Edit
														</button>
														<button
															class="text-xs text-red-500 hover:text-red-700"
															on:click={() => removeDataFilter(containerIndex)}
														>
															Remove
														</button>
													</div>
												</div>

												<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
													{#each Object.entries(group.definition.data).filter(([key]) => key !== 'type') as [property, value]}
														<div>
															<span class="font-medium">{property}:</span>
															{displayPropertyValue(
																value,
																property === 'gender' ||
																	property === 'raceType' ||
																	property === 'ethnicityType'
																	? 'concept'
																	: undefined
															)}
														</div>
													{/each}
												</div>
											</div>
										</div>
									{/if}
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-center p-12">
				<button
					on:click={createChart}
					class="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 ease-in-out before:absolute before:inset-0 before:bg-white before:opacity-0 before:transition-opacity hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:before:opacity-10 active:scale-95"
				>
					<span class="relative z-10 flex items-center justify-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Create New Chart
					</span>
				</button>
			</div>
		</div>
	</div>
</div>
<div
	class="fixed right-0 top-[60px] h-[calc(100vh-60px)] w-[400px] overflow-y-auto border-l border-gray-300 bg-gray-50 p-5"
>
	{#if editingCountBy}
		<div class="mb-4">
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-bold text-gray-800">Count By Settings</h3>
				<button
					class="text-sm text-gray-500 hover:text-gray-700"
					on:click={() => {
						editingCountBy = false;
					}}
				>
					Cancel
				</button>
			</div>
			<p class="mb-4 text-sm text-gray-600">Configure Count By parameters for the Y-axis.</p>
		</div>

		<div class="mb-6 space-y-4">
			<!-- Concept Setting -->
			<div class="mb-3">
				<label class="mb-1 block text-sm font-medium text-gray-700">Concept</label>
				<ConceptSelectorWrapper
					value={currentCountByValues.concept || {}}
					placeholder="Select concept"
					on:change={(e) => updateCountByValue('concept', e.detail)}
				/>
			</div>

			<!-- Age Setting -->
			<div class="mb-3">
				<label class="mb-1 block text-sm font-medium text-gray-700">Age</label>
				<NumberOperator
					value={currentCountByValues.age || {}}
					placeholder="Enter age"
					on:change={(e) => updateCountByValue('age', e.detail)}
				/>
			</div>

			<!-- Date Setting -->
			<div class="mb-3">
				<label class="mb-1 block text-sm font-medium text-gray-700">Date</label>
				<DateOperator
					value={currentCountByValues.date || {}}
					on:change={(e) => updateCountByValue('date', e.detail)}
				/>
			</div>

			<!-- Value Setting -->
			<div class="mb-3">
				<label class="mb-1 block text-sm font-medium text-gray-700">Value</label>
				<NumberOperator
					value={currentCountByValues.value || {}}
					placeholder="Enter value"
					on:change={(e) => updateCountByValue('value', e.detail)}
				/>
			</div>
		</div>

		<div class="mt-6 flex justify-end">
			<button
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				on:click={saveCountBySettings}
			>
				Save Count By Settings
			</button>
		</div>
	{:else if selectedDomainType === null}
		<div class="mb-4">
			<!-- Display context info based on the current editing state -->
			{#if editingGroupIndex !== null}
				<h3 class="mb-2 text-xl font-bold text-gray-800">
					Add Filter to {groups[editingGroupIndex].name}
				</h3>
			{:else if editingDataIndex !== null}
				<h3 class="mb-2 text-xl font-bold text-gray-800">
					Add Data to {groups[editingDataIndex].name}
				</h3>
			{:else if editingFilterIndex !== null}
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
							<IdentifierOperator
								value={currentFilterValues[property.name] || {}}
								options={conceptsets.map((cs) => ({
									id: cs.conceptset_id.toString(),
									name: cs.name || `Concept Set ${cs.conceptset_id}`
								}))}
								placeholder="Select concept set"
								on:change={(e) => updateFilterValue(property.name, e.detail)}
							/>
						{:else if property.type === 'concept'}
							<ConceptSelectorWrapper
								value={currentFilterValues[property.name] || {}}
								{property}
								onChange={updateFilterValue}
							/>
						{:else if property.type === 'numberrange'}
							<NumberOperator
								value={currentFilterValues[property.name] || {}}
								placeholder="Enter number"
								on:change={(e) => updateFilterValue(property.name, e.detail)}
							/>
						{:else if property.type === 'daterange'}
							<DateOperator
								value={currentFilterValues[property.name] || {}}
								on:change={(e) => updateFilterValue(property.name, e.detail)}
							/>
						{:else if property.type === 'string'}
							<StringOperator
								value={currentFilterValues[property.name] || {}}
								placeholder="Enter text"
								on:change={(e) => updateFilterValue(property.name, e.detail)}
							/>
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

<!-- Chart Type Selection Modal -->
<ChartTypeModal
	bind:show={showChartTypeModal}
	bind:selectedChartType={chartType}
	on:save={handleChartTypeUpdate}
/>

<ConceptSetModal
	bind:show={showConceptSetModal}
	conceptSets={conceptsets}
	on:update={handleConceptSetUpdate}
	on:close={() => (showConceptSetModal = false)}
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
