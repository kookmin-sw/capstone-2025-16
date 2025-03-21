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
	import { createEventDispatcher } from 'svelte';
	let { event_type } = $props();

	const dispatch = createEventDispatcher();
	let add = $state({});

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
	const EventComponent = $derived(EventComponents[event_type]);
	$effect(() => {
		dispatch('add', add);
	});
</script>
{#if EventComponent}
	<EventComponent on:add={({ detail }) => (add = detail)} />
{/if}
