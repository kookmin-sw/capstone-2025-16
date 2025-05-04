<script>
    import { onMount } from 'svelte';
	import { xmlParseToJson } from '$lib/ecgparse.js';
	import * as d3 from 'd3';

	export let filePath;
	let container;

    onMount(async () => {
		const xml = await xmlParseToJson(filePath);
		renderAllECGWaveforms(container, xml);
	});

	async function loadAndRenderWaveform(signal) {
		try {
			xml = await xmlParseToJson(`/your/path/${signal.fileName}`); // bioSignal에 파일명이 있다면
			renderAllECGWaveforms(waveformContainer, xml);
		} catch (error) {
			console.error("Waveform 처리 중 오류 발생:", error);
		}
	}
    
	function decodeBase64ToInt16Array(base64, unitsPerBit = 1) {
		const binary = atob(base64);
		const len = binary.length / 2;
		const int16 = new Int16Array(len);

		for (let i = 0; i < len; i++) {
			const lo = binary.charCodeAt(i * 2);
			const hi = binary.charCodeAt(i * 2 + 1);
			// Little-endian
			int16[i] = (hi << 8) | lo;
		}

		return Array.from(int16).map((v) => v * unitsPerBit); // 단위 보정
	}

	function drawLeadChart(container, values, duration, leadId) {
		const margin = { top: 10, right: 10, bottom: 10, left: 10 };
		const width = 200;
		const height = 200;

		const xScale = d3
			.scaleLinear()
			.domain([0, duration])
			.range([margin.left, width - margin.right]);

		const yExtent = d3.extent(values);
		const yScale = d3
			.scaleLinear()
			.domain([yExtent[0], yExtent[1]])
			.range([height - margin.bottom, margin.top]);

		const line = d3
			.line()
			.x((d, i) => xScale(i * (duration / values.length)))
			.y((d) => yScale(d));

		const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

		svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'white');

		svg.append('text').attr('x', margin.left).attr('y', 15).attr('fill', '#333').text(`${leadId}`);

		svg
			.append('path')
			.datum(values)
			.attr('fill', 'none')
			.attr('stroke', '#007acc')
			.attr('stroke-width', 1)
			.attr('d', line);
	}

	function renderAllECGWaveforms(container, waveformList) {
		d3.select(container).selectAll("*").remove(); // 기존 SVG 제거

		waveformList.forEach((waveform) => {
			const SampleBase = waveform.SampleBase;
      const waveformContainer = document.createElement('div');
      waveformContainer.style.display = 'flex';
			waveform.LeadData.forEach((lead) => {
				const { LeadID, LeadSampleCountTotal, LeadAmplitudeUnitsPerBit, WaveFormData } = lead;
        
				const duration = LeadSampleCountTotal / SampleBase;
				const decoded = decodeBase64ToInt16Array(WaveFormData, LeadAmplitudeUnitsPerBit);
				const leadContainer = document.createElement('div');
				leadContainer.style.marginBottom = '24px';
				waveformContainer.appendChild(leadContainer);

				drawLeadChart(leadContainer, decoded, duration, LeadID);
			});
      container.appendChild(waveformContainer);
		});
	}
</script>

<div bind:this={container} class="overflow-x-auto max-h-[1000px]"></div>