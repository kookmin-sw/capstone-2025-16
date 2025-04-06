<script>
    import * as d3 from 'd3';

    export let data = {};  // { Male: 600, Female: 350, Unknown: 50 } 형식
    export let hoveredLabel = null;

    // color scale 정의
    const colorScale = d3
        .scaleOrdinal()
        .domain([
          "Male", "Female", "Unknown",
          "Alive", "Deceased",
          "Inpatient", "Outpatient", "Emergency Room Visit", "Home Visit", "Other Visit Type"
        ])
        .range([
          "#3498db", "#F9A7B0", "#808080",
          "#4CAF50", "#5E6C7F",
          "#FF6B6B", "#4ECDC4", "#FFB236", "#95A5A6", "#BDC3C7"
        ]);

    // 데이터 처리
    $: processedData = Object.entries(data);
    $: total = processedData.reduce((sum, [_, value]) => sum + value, 0);

    // 퍼센트 계산 함수
    const calculatePercent = (value) => {
        return ((value / total) * 100).toFixed(1) + '%';
    };
</script>

<div class="legend-container flex flex-wrap justify-center gap-0">
    {#each processedData as [label, value]}
        <div 
            role="button"
            tabindex="0"
            class="legend-item flex items-center gap-2 cursor-pointer transition-opacity duration-200"
            class:opacity-30={hoveredLabel && hoveredLabel !== label}
            on:mouseenter={() => hoveredLabel = label}
            on:mouseleave={() => hoveredLabel = null}
        >
            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {colorScale(label)}"></div>
            <span class="text-xs whitespace-nowrap">
                {label}
            </span>
        </div>
    {/each}
</div>

<style>
    .legend-container {
        max-width: 100%;
    }

    .legend-item {
        padding: 0.025rem 0.5rem;
        border-radius: 1rem;
    }

    .legend-item:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
</style> 