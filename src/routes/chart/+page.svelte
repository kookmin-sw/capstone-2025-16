<script>
	import { onMount } from "svelte";
	import ChartCard from "$lib/components/ChartCard.svelte";
	import BarChartHorizontal from "../../lib/components/BarChart_horizontal.svelte";
	import BarChartVertical from "../../lib/components/BarChart_vertical.svelte";
    import DonutChart from "$lib/components/DonutChart.svelte";
    import { tick } from "svelte";

	let topTenDrugData = [];
	let patientAgeData = [];
    let genderData = {};
    let deathRatioData = {};
    
	// 데이터 불러오기
    onMount(async () => {
    try {
        const [topTenDrugRes, patientAgeRes, genderRes, deathRatioRes] = await Promise.all([
            fetch("/topTenDrug-testdata.json"),
            fetch("/patientAge-testdata.json"),
            fetch("/gender-testdata.json"),
            fetch("/deathRatio-testdata.json")
        ]);

        if (!topTenDrugRes.ok || !patientAgeRes.ok || !genderRes.ok || !deathRatioRes.ok) {
            throw new Error("One or more fetch requests failed");
        }

        topTenDrugData = await topTenDrugRes.json();
        patientAgeData = await patientAgeRes.json();
        genderData = await genderRes.json();
        deathRatioData = await deathRatioRes.json();
    } catch (error) {
        console.error("❌ Error loading data:", error);
    }
    });


</script>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 30px;
		width: 100%; /* 부모 컨테이너가 화면 전체 너비 사용 */
        max-width: 1000px;
		padding-top: 40px;
		padding-bottom: 40px;
		margin: 0 auto; /* 중앙 정렬 */
        
	}

	.title {
		font-size: 28px;
		font-weight: bold;
		text-align: center;
		margin-bottom: 0px;
	}

	.description {
		font-size: 16px;
		color: #555;
		text-align: center;
		margin-bottom: 20px;
	}

    .chart-row {
	display: flex;
	justify-content: center; /* 중앙 정렬 */
	align-items: stretch;
	gap: 20px; /* 차트 사이 여백 */
    margin: 0 auto;
	width: 1000px;
	flex-wrap: wrap; /* 화면이 좁아지면 아래로 떨어지도록 설정 */
    }

</style>

<div class="page-container">     
<!-- 코호트 제목 -->
<div class="title">Cohort Analysis Report</div>
<!-- 설명 -->
<div class="description">
    The charts below visualize the results of cohort analysis data. Each item is generated based on the data, providing various statistics depending on the chart type.</div>

    <div class="chart-row">
        <!-- 도넛 차트를 카드로 표시 -->
        <ChartCard
        title="Gender"
        description="The number of people in this cohort stratified by gender."type="half">
        <DonutChart data = {genderData} />
        </ChartCard>

        <ChartCard
        title="Death Ratio"
        description="The number of people in this cohort stratified by death ratio."type="half">
        <DonutChart data = {deathRatioData}/>
        </ChartCard>

    </div>

    <!-- 세로형 차트를 카드로 표시 -->
    <ChartCard
        title="Distribution by patient age">
        {#if patientAgeData.length > 0}
            <BarChartVertical data={patientAgeData} />
        {:else}
            <p>Loading chart...</p>
        {/if}
    </ChartCard>

	<!-- 가로형 차트를 카드로 표시 -->
	<ChartCard
		title="Top 10 Prescribed in Target Group"
		description="The top 10 most prescribed medications within the cohort.">
		{#if topTenDrugData.length > 0}
			<BarChartHorizontal data={topTenDrugData} />
		{:else}
			<p>Loading chart...</p>
		{/if}
	</ChartCard>
    </div>
    