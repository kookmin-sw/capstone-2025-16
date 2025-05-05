<script>
	import { xmlParseToJson } from '$lib/ecgparse.js';
  	import ECGViewer from '$lib/components/ECGViewer.svelte';

	export let bioSignal;
</script>

<div class="bioContainer flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
	<h2 class="title">Bio Signal Information</h2>

	{#each bioSignal as signal, i}
		<div class="bio-signal-row">
			<span class="text-sm"><strong>Date:</strong> {signal.bio_signal_date}</span>
			<span class="divider">|</span>
			<span class="text-sm"><strong>Concept ID:</strong> {signal.bio_signal_concept_id}</span>
			<span class="divider">|</span>
			<span class="text-sm"><strong>Source Value:</strong> {signal.bio_signal_source_value}</span>
		</div>
		<ECGViewer filePath="/140474_20160807_0830.xml"/>
	{/each}
</div>

<style>
	.title {
		font-size: 1.3rem;
		font-weight: bold;
		margin-bottom: 10px;
	}

	.bio-signal-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		padding: 8px 0;
		font-size: 1rem;
		background: #fff;
		border-bottom: 1px solid #ddd;
		white-space: nowrap;
	}

	.divider {
		color: #888;
		font-weight: bold;
		margin: 0 10px;
	}
</style>
