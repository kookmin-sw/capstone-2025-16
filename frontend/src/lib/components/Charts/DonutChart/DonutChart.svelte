<script>
    import * as d3 from "d3";
    import { tick } from "svelte";

    export let data = {};
    export let hoveredLabel = null;
    export let width = 200;
    export let height = 200;
    export let margin = 0;

    // The radius of the pie plot
    let radius = Math.min(width, height) / 2 - margin;

    // 데이터가 유효한지 확인하고 처리
    $: processedData = data && Object.keys(data).length > 0 ? Object.entries(data) : [];
    $: color = d3
        .scaleOrdinal()
        .domain([
          // Gender
          "Male", "Female", "Unknown",
          // Mortality
          "Alive", "Deceased",
          // Visit Type
          "Inpatient", "Outpatient", "Emergency Room Visit", "Home Visit", "Other Visit Type"
        ])
        .range([
          // Gender colors
          "#3498db", "#F9A7B0", "#808080",
          // Mortality colors
          "#4CAF50", "#5E6C7F",
          // Visit Type colors
          "#FF6B6B", "#4ECDC4", "#FFB236", "#95A5A6", "#BDC3C7"
        ]);

    // 데이터가 있을 때만 실행하도록 수정
    $: data_ready = processedData.length > 0 ? d3.pie().sort(null).value(d => d[1])(processedData) : [];

    // The arc generator
    const arc = d3
        .arc()
        .innerRadius(radius * 0.2)
        .outerRadius(radius * 0.8);

    // 호버 시 약간 확대된 아크
    const arcHover = d3
        .arc()
        .innerRadius(radius * 0.18)
        .outerRadius(radius * 0.82);

    $: total = processedData.reduce((sum, [_, value]) => sum + value, 0);
    
    // 퍼센트 계산 함수
    const calculatePercent = (value) => {
        return ((value / total) * 100).toFixed(1) + '%';
    };

    // `data` 변경 시 UI 갱신을 강제
    $: tick();

    // hoveredSlice를 hoveredLabel에 따라 업데이트
    $: hoveredSlice = hoveredLabel ? 
        data_ready.find(slice => slice.data[0] === hoveredLabel) : 
        null;
</script>

<div class="chart-container flex flex-col items-center">
    {#if processedData.length > 0}
        <svg {width} {height} viewBox="{-width / 2}, {-height / 2}, {width}, {height}" style:max-width="100%" style:height="auto">
            <g class="chart-inner">
                {#each data_ready as slice}
                    <path
                        d={hoveredSlice === slice ? arcHover(slice) : arc(slice)}
                        fill={color(slice.data[0])}
                        stroke="white"
                        class="slice"
                        role="button"
                        tabindex="0"
                        on:mouseenter={() => hoveredSlice = slice}
                        on:mouseleave={() => hoveredSlice = null}
                    />
                    {#if hoveredSlice === slice}
                        <text
                            transform={`translate(${arc.centroid(slice)})`}
                            text-anchor="middle"
                            class="value-text"
                        >
                            <tspan x="0" dy="-0.5em" class="label">{slice.data[0]}</tspan>
                            <tspan x="0" dy="1.2em" class="value">{slice.data[1]}</tspan>
                            <tspan x="0" dy="1.2em" class="percent">({calculatePercent(slice.data[1])})</tspan>
                        </text>
                    {/if}
                {/each}
            </g>
        </svg>
    {:else}
        <p>Loading chart...</p>
    {/if}
</div>

<style>
    .chart-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
    }

    .chart-inner path {
        stroke-width: 2px;
        stroke-linejoin: round;
        transition: all 0.3s ease;
    }

    .slice {
        cursor: pointer;
        outline: none;
    }

    .slice:hover, .slice:focus {
        filter: brightness(1.1);
    }

    .value-text {
        font-size: 13px;
        fill: white;
        pointer-events: none;
    }

    .value-text .label {
        font-weight: bold;
        font-size: 10px;
    }

    .value-text .value,
    .value-text .percent {
        font-size: 9px;
    }
</style>