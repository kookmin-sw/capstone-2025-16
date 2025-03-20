<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	let { eventdata } = $props();
	console.log('asdsaad cscac d s', eventdata);
	let firstDiagnosis = $derived(convertOperator2Factor(eventdata.firstDiagnosis));
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let eraStartAge = $derived(convertOperator2Factor(eventdata.filters.eraStartAge));
	let eraEndAge = $derived(convertOperator2Factor(eventdata.filters.eraEndAge));
	let eraConditionCount = $derived(convertOperator2Factor(eventdata.filters.eraConditionCount));
	let eraLength = $derived(convertOperator2Factor(eventdata.filters.eraLength));
</script>

<div class="ml-2 flex flex-col space-y-2 text-sm text-zinc-700">
	<p class="underline decoration-zinc-800 underline-offset-2">
		For the first time in the patient's hospital record
	</p>

		
	<p>
		Era start:
		<span>
			<DateOperator
				readonly={true}
				operator={startDate.operator}
				startDate={startDate.start}
				endDate={startDate.end}
			/>
		</span>
	</p>

	<p>
		Era end:
		<DateOperator
			readonly={true}
			operator={endDate.operator}
			startDate={endDate.start}
			endDate={endDate.end}
		/>
	</p>

	<p>
		Occurrence count:
		<NumberOperator
			readonly={true}
			operator={eraConditionCount.operator}
			startNumber={eraConditionCount.start}
			endNumber={eraConditionCount.end}
		/>
	</p>

	<p>
		Era length:
		<NumberOperator
			readonly={true}
			operator={eraLength.operator}
			startNumber={eraLength.start}
			endNumber={eraLength.end}
		/>
	</p>

	<p>
		Age at era start:
		<NumberOperator
			readonly={true}
			operator={eraStartAge.operator}
			startNumber={eraStartAge.start}
			endNumber={eraStartAge.end}
		/>
	</p>

	<p>
		Age at era end:
		<NumberOperator
			readonly={true}
			operator={eraEndAge.operator}
			startNumber={eraEndAge.start}
			endNumber={eraEndAge.end}
		/>
	</p>

	<p>
		Gender:
		<button class="underline decoration-zinc-800 underline-offset-2">Male</button>
	</p>
</div>
