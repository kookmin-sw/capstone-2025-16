<script>
    import * as d3 from 'd3';

    export let data = {};  // { Male: 600, Female: 350, Unknown: 50 } 형식
    export let hoveredLabel = null;

    // color scale 정의
    const colorScale = d3
        .scaleOrdinal()
        .domain([
          "MALE", "FEMALE", "UNKNOWN",
          "alive", "deceased",
          "Inpatient Visit", "Ambulatory Surgical Center", "Emergency Room and Inpatient Visit", "Emergency Room - Hospital", "Observation Room", "Ambulatory Clinic / Center"
        ])
        .range([
          "#3498db", "#F9A7B0", "#808080",
          "#4CAF50", "#5E6C7F",
          "#4F8EF7", "#F78CA2", "#FFD166", "#06D6A0", "#9B5DE5",
          "#43AA8B", "#FF61A6", "#3A86FF", "#FFBE0B"
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