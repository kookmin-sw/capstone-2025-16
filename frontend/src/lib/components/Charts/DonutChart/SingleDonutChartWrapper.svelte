<script>
    import DonutChart from './DonutChart.svelte';
    import Legend from './Legend.svelte';
    
    export let data = {};  // { Male: 600, Female: 350, Unknown: 50 } 형식으로 받음
    
    let hoveredLabel = null;
</script>

<div class="flex flex-col items-center justify-center h-full">
    <div class="flex-1 flex items-center justify-center">
        <DonutChart 
            {data}
            {hoveredLabel}
            width={200}
            height={200}
        />
    </div>
    <Legend {data} bind:hoveredLabel />
</div>

<style>
    div {
        width: 100%;
    }
</style>
