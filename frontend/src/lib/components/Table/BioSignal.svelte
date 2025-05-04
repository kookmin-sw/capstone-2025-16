<script>
	import { xmlParseToJson } from '$lib/ecgparse.js';
  import ECGViewer from '$lib/components/ECGViewer.svelte';

	export let bioSignal;
</script>

<div class="bio-signal-container">
	<h2 class="title">Bio Signal Information</h2>

	{#each bioSignal as signal, i}
		<div class="bio-signal-row">
			<span class="info"><strong>Date:</strong> {signal.bio_signal_date}</span>
			<span class="divider">|</span>
			<span class="info"><strong>Concept ID:</strong> {signal.bio_signal_concept_id}</span>
			<span class="divider">|</span>
			<span class="info"><strong>Source Value:</strong> {signal.bio_signal_source_value}</span>
		</div>
		<ECGViewer filePath="/140474_20160807_0830.xml"/>
	{/each}
</div>

<style>
	.bio-signal-container {
		padding: 16px;
		background: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #ddd;
		max-width: 100%;
	}

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

	.info {
		font-weight: normal;
		font-size: 1.1rem;
		margin-right: 10px;
	}

	.divider {
		color: #888;
		font-weight: bold;
		margin: 0 10px;
	}
</style>
