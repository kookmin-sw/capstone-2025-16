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
          "MALE", "FEMALE", "UNKNOWN",
          // Mortality
          "alive", "deceased",
          // Visit Type
          "Inpatient Visit", "Ambulatory Surgical Center", "Emergency Room and Inpatient Visit", "Emergency Room - Hospital", "Observation Room", "Ambulatory Clinic / Center"
        ])
        .range([
          // Gender colors
          "#3498db", "#F9A7B0", "#808080",
          // Mortality colors
          "#4CAF50", "#5E6C7F",
          // Visit Type colors
          "#4F8EF7", "#F78CA2", "#FFD166", "#06D6A0", "#9B5DE5",
          "#43AA8B", "#FF61A6", "#3A86FF", "#FFBE0B"
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

    let tooltip = { show: false, x: 0, y: 0, label: '', value: 0, percent: '' };

    function showTooltip(event, slice) {
        const [svgX, svgY] = arc.centroid(slice);
        const svg = event.target.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = svgX;
        pt.y = svgY;
        const screenCTM = svg.getScreenCTM();
        const { x, y } = pt.matrixTransform(screenCTM);

        tooltip = {
            show: true,
            x,
            y,
            label: slice.data[0],
            value: slice.data[1],
            percent: calculatePercent(slice.data[1])
        };
    }

    function hideTooltip() {
        tooltip.show = false;
    }
</script>

<div class="chart-container flex flex-col items-center" style="position:relative;">
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
                        on:mouseenter={(e) => { hoveredSlice = slice; showTooltip(e, slice); }}
                        on:mouseleave={() => { hoveredSlice = null; hideTooltip(); }}
                    />
                {/each}
            </g>
        </svg>
        {#if tooltip.show}
            <div
                class="donut-tooltip"
                style="position:fixed; left:{tooltip.x}px; top:{tooltip.y}px; pointer-events:none; z-index:9999;"
            >
                <div><b>{tooltip.label}</b></div>
                <div>{tooltip.value} ({tooltip.percent})</div>
            </div>
        {/if}
    {:else if processedData.length === 0}
        <div class="flex items-center justify-center h-[150px] w-full">
            <div class="text-center text-xs text-gray-500">
            <p>Currently, no data is available for display.</p>
            </div>
        </div>
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
    
    .donut-tooltip {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        padding: 2px 4px;
        font-size: 9px;
        color: #222;
        pointer-events: none;
        white-space: nowrap;
    }
</style>