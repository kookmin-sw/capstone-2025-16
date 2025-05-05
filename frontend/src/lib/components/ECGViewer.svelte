<script>
    import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { xmlParseToJson } from '$lib/ecgparse.js';
	import * as d3 from 'd3';

	export let filePath;
	let container;
	let showCharts = false;
	let xml;

    onMount(async () => {
		xml = await xmlParseToJson(filePath);
	});
	
	$: if (showCharts) {
		renderAllECGWaveforms(container, xml);
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

	async function renderAllECGWaveforms(container, waveformList) {
		await tick();
		if (!container) return;
		d3.select(container).selectAll("*").remove(); // 기존 SVG 제거

		waveformList.forEach((waveform) => {
			const SampleBase = waveform.SampleBase;
			const waveformContainer = document.createElement('div');
			waveformContainer.className = 'waveformContainer';
			waveformContainer.style.display = 'flex';
			waveformContainer.style.overflowX = "auto";
				waveform.LeadData.forEach((lead) => {
					const { LeadID, LeadSampleCountTotal, LeadAmplitudeUnitsPerBit, WaveFormData } = lead;
			
					const duration = LeadSampleCountTotal / SampleBase;
					const decoded = decodeBase64ToInt16Array(WaveFormData, LeadAmplitudeUnitsPerBit);
					const leadContainer = document.createElement('div');
					leadContainer.className = 'leadContainer'
					leadContainer.style.marginBottom = '24px';

					waveformContainer.appendChild(leadContainer);

					drawLeadChart(leadContainer, decoded, duration, LeadID);
				});
			container.appendChild(waveformContainer);
		});
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

		svg.append('path').datum(values).attr('fill', 'none').attr('stroke', '#007acc').attr('stroke-width', 1).attr('d', line);

		// 1. circle + tooltip 요소 생성
		const focusCircle = svg.append('circle')
			.attr('r', 3)
			.attr('fill', 'red')
			.style('display', 'none');

		const tooltip = d3.select('body')
			.append('div')
			.style('position', 'absolute')
			.style('background', 'white')
			.style('border', '1px solid #ccc')
			.style('padding', '4px 8px')
			.style('font-size', '12px')
			.style('pointer-events', 'none')
			.style('display', 'none');

		// 2. 마우스 이벤트를 위한 overlay
		svg.append('rect')
			.attr('width', width)
			.attr('height', height)
			.attr('fill', 'none')
			.attr('pointer-events', 'all')
			.on('mousemove', (event) => {
				const [mx] = d3.pointer(event);
				const t = (mx - margin.left) / (width - margin.left - margin.right); // 비율
				const i = Math.floor(t * values.length);
				if (i < 0 || i >= values.length) return;

				const x = xScale(i * (duration / values.length));
				const y = yScale(values[i]);

				focusCircle
					.attr('cx', x)
					.attr('cy', y)
					.style('display', 'block');
				
				const tooltipWidth = tooltip.node().offsetWidth;
				const tooltipHeight = tooltip.node().offsetHeight;

				let left = event.pageX + 10;
				let top = event.pageY + 10;

				// 화면 밖 방지
				if (left + tooltipWidth > window.innerWidth) {
					left = event.pageX - tooltipWidth - 10;
				}
				if (top + tooltipHeight > window.innerHeight) {
					top = event.pageY - tooltipHeight - 10;
				}

				tooltip
					.style('left', `${left}px`)
					.style('top', `${top}px`)
					.style('display', 'block')
					.html(`Value: ${values[i].toFixed(2)}<br/>Index: ${i}`);

				})
				.on('mouseout', () => {
					focusCircle.style('display', 'none');
					tooltip.style('display', 'none');
				});
	}
</script>

<button
	class="px-3 py-1 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600"
	on:click={() => showCharts = !showCharts}
>
	{showCharts ? 'Hide ECG Graphs' : 'Show ECG Graphs'}
</button>

{#if showCharts}
	<div bind:this={container} class="max-h-[1000px] overflow-hidden" transition:slide></div>
{/if}