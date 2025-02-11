<script>
    import * as d3 from "d3";
    import { tick } from "svelte";

    export let data = {};

    let width = 450;
    let height = 450;
    let margin = 40;

    // The radius of the pie plot
    let radius = Math.min(width, height) / 2 - margin;

    // 데이터가 유효한지 확인하고 처리
    $: processedData = data && Object.keys(data).length > 0 ? Object.entries(data) : [];
    $: color = d3
        .scaleOrdinal()
        .domain(["Male", "Female", "Alive", "Deceased"])
        .range(["#3498db", "#F9A7B0","#4CAF50", "#5E6C7F"]);

    // 데이터가 있을 때만 실행하도록 수정
    $: data_ready = processedData.length > 0 ? d3.pie().sort(null).value(d => d[1])(processedData) : [];

    // The arc generator
    const arc = d3
        .arc()
        .innerRadius(radius * 0.2) // Size of the donut hole
        .outerRadius(radius * 0.8);

    // `data` 변경 시 UI 갱신을 강제
    $: tick();
</script>

<div class="chart-container">
    {#if processedData.length > 0}
        <svg {width} {height} viewBox="{-width / 2}, {-height / 2}, {width}, {height}" style:max-width="100%" style:height="auto">
            <g class="chart-inner">
                {#each data_ready as slice}
                    <path d={arc(slice)} fill={color(slice.data[0])} stroke="white" />
                {/each}
            </g>
        </svg>

        <!-- 범주(legend) 추가 -->
        <div class="legend">
            {#each processedData as [key, value]}
                <div class="legend-item">
                    <span class="legend-color" style="background-color: {color(key)};"></span>
                    <span class="legend-label">{key}</span>
                </div>
            {/each}
        </div>
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
    }

    .legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: inline-block;
    }

    .legend-label {
        font-size: 14px;
        color: #333;
    }
</style>
