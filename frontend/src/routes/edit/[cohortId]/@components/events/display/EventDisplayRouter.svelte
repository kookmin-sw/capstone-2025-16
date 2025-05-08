<script>
	import ConditionEraEvent from './ConditionEraEvent.svelte';
	import DrugEraEvent from './DrugEraEvent.svelte';
	import ConditionOccurrenceEvent from './ConditionOccurrenceEvent.svelte';
	import DeathEvent from './DeathEvent.svelte';
	import DeviceExposureEvent from './DeviceExposureEvent.svelte';
	import DoseEraEvent from './DoseEraEvent.svelte';
	import DrugExposureEvent from './DrugExposureEvent.svelte';
	import MeasurementEvent from './MeasurementEvent.svelte';
	import ObservationEvent from './ObservationEvent.svelte';
	import ObservationPeriodEvent from './ObservationPeriodEvent.svelte';
	import ProcedureOccurrenceEvent from './ProcedureOccurrenceEvent.svelte';
	import SpecimenEvent from './SpecimenEvent.svelte';
	import VisitOccurrenceEvent from './VisitOccurrenceEvent.svelte';
	import DemographicEvent from './DemographicEvent.svelte';
	// 다른 이벤트 컴포넌트들도 필요에 따라 import

	let { eventdata } = $props();

	const EventComponents = {
		condition_era: ConditionEraEvent,
		drug_era: DrugEraEvent,
		condition_occurrence: ConditionOccurrenceEvent,
		death: DeathEvent,
		device_exposure: DeviceExposureEvent,
		dose_era: DoseEraEvent,
		drug_exposure: DrugExposureEvent,
		measurement: MeasurementEvent,
		observation: ObservationEvent,
		observation_period: ObservationPeriodEvent,
		procedure_occurrence: ProcedureOccurrenceEvent,
		specimen: SpecimenEvent,
		visit_occurrence: VisitOccurrenceEvent,
		demographic: DemographicEvent
		// 다른 이벤트 타입들에 대한 케이스 추가
	};

	// 이벤트 타입에 따라 적절한 컴포넌트 반환
	console.log('adasd', eventdata);
	const EventComponent = $derived(EventComponents[eventdata.type]);
</script>

{#if EventComponent}
	<EventComponent {eventdata} />
{:else}
	<div class="text-red-500">알 수 없는 이벤트 타입: {eventdata.type}</div>
{/if}
