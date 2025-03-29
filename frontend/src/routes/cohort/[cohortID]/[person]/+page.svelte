<script>
    import { onMount, onDestroy, tick } from "svelte";
    import CDMInfo from "$lib/components/Table/CDMInfo.svelte";
    import Condition from "$lib/components/Table/Condition.svelte";
    import Drug from "$lib/components/Table/Drug.svelte";
    import Measurement from "$lib/components/Table/Measurement.svelte";
    import Observation from "$lib/components/Table/Observation.svelte";
    import ProcedureOccurrence from "$lib/components/Table/ProcedureOccurrence.svelte";
    import Specimen from "$lib/components/Table/Specimen.svelte";
    import BioSignal from "$lib/components/Table/BioSignal.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import * as d3 from "d3";

    import analysisData from '$lib/data/patientAnalysisTest.json';
    import ChartCard from '$lib/components/ChartCard.svelte';
    import DataTable from '$lib/components/DataTable.svelte';
    import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
    import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';
    import { transformDonutChartToTableData } from '$lib/components/Charts/DonutChart/donutChartTransformer.js';
    import BarChart from "$lib/components/Charts/BarChart/BarChart.svelte"
    import BarChartWrapper from "$lib/components/Charts/BarChart/BarChartWrapper.svelte"
    import BarChartTableView from '$lib/components/Charts/BarChart/BarChartTableView.svelte';

    let timelineContainer;
    let showModal = false;
    let isStatisticsView = true;
    let show = false;
    export let data;

    let isTableView = {
        visitTypeRatio: false,
        departmentVisits: false,
        topTenDrugs: false,
        topTenConditions: false,
        topTenProcedures: false,
        topTenMeasurements: false
    };
    
    const genderCodes = {
        8507: "Male",
        8532: "Female",
        8551: "Other",
        0: "Unknown"
    };
    
    const tableComponents = {
        condition: Condition,
        drug: Drug,
        measurement: Measurement,
        observation: Observation,
        procedure_occurrence: ProcedureOccurrence,
        specimen: Specimen,
        bio_signal: BioSignal
    };

    let selectedTables = new Set(Object.keys(tableComponents)); // Object.keys(tableComponents)

    //   데이터 매칭 (각 테이블에 해당하는 props 설정)
    let tableProps = {};
    let personTable = {
        "person_id": 1,
        "gender_concept_id": 8507,
        "year_of_birth": 1985,
        "month_of_birth": 6,
        "day_of_birth": 15,
        "race_concept_id": 8527,
        "ethnicity_concept_id": 38003563,
        "location_id": 101,
        "provider_id": 201,
        "care_site_id": 301,
        "death": {
            "person_id": 1,
            "death_date": "2030-07-15",
            "death_datetime": "2030-07-15T08:42:00",
            "death_type_concept_id": 38003569,
            "cause_concept_id": 321042,
            "cause_source_value": "I21.9",
            "cause_source_concept_id": 44814645
        },
    };

    const visitMapping = {
        9201: [0, "Inpatient", "#FF6B6B"],
        9202: [1, "Outpatient", "#4ECDC4"],
        9203: [2, "Emergency Room Visit", "#FFB236"],
        581477: [3, "Home Visit", "#95A5A6"],
        44818517: [4, "Other Visit Type", "#BDC3C7"]
    };

    async function fetchDataById(id) {
        try {
            const res = await fetch("/cdm_sample_data.json");
            const fullData = await res.json();
            const visitOccurrenceIdData = fullData[id];
            tableProps = {
                cdm_info: { careSite: visitOccurrenceIdData.care_site, location: visitOccurrenceIdData.location, visitOccurrence: visitOccurrenceIdData.visit_occurrence },
                condition: { conditionEra: visitOccurrenceIdData.condition_era, conditionOccurrence: visitOccurrenceIdData.condition_occurrence },
                drug: { drugExposure: visitOccurrenceIdData.drug_exposure },
                measurement: { measurement: visitOccurrenceIdData.measurement },
                observation: { observation: visitOccurrenceIdData.observation },
                procedure_occurrence: { procedureOccurrence: visitOccurrenceIdData.procedure_occurrence },
                specimen: { specimen: visitOccurrenceIdData.specimen },
                bio_signal: { bioSignal: visitOccurrenceIdData.bio_signal }
            };
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        }
    }

    const MARGIN = { top: 20, right: 20, bottom: 30, left: 130 };
    const BAR_HEIGHT = 20;
    const ROW_GAP = 25;
    const DEATH_BAR_WIDTH = 5;

    let xScale, xAxisGroup, innerWidth, innerHeight;

    async function drawTimeline() {
        await tick();
        if (!timelineContainer || !data?.personVisits) return;

        const width = timelineContainer.clientWidth;
        const height = timelineContainer.clientHeight;
        innerWidth = width - MARGIN.left - MARGIN.right;
        innerHeight = height - MARGIN.top - MARGIN.bottom;

        const svg = initializeSvg(width, height);
        xScale = setupScales(width);
        setupClipPath(svg);
        const tooltip = setupTooltip();
        drawYAxis(svg);
        drawXAxis(svg);
        drawBars(svg, tooltip);
        setupZoom(svg, width, height);
    }

    function initializeSvg(width, height) {
        let svg = d3.select(timelineContainer).select("svg");
        if (!svg.node()) {
            svg = d3.select(timelineContainer)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("border", "1px solid black");
        }
        svg.selectAll("*").remove();
        return svg;
    }

    function setupScales(width) {
        let minStart = new Date(Math.min(...data.personVisits.map(d => new Date(d.visit_start_date))));
        let maxEnd = new Date(Math.max(...data.personVisits.map(d => new Date(d.visit_end_date))));
        minStart.setDate(minStart.getDate() - 360);
        minStart.setHours(0, 0, 0, 0);
        maxEnd.setHours(23, 59, 59, 999);
        maxEnd.setDate(maxEnd.getDate() + 360);

        return d3.scaleTime()
            .domain([minStart, maxEnd])
            .range([MARGIN.left, width - MARGIN.right]);
    }

    function setupClipPath(svg) {
        svg.append("defs")
                .append("clipPath")
                .attr("id", "clip-timeline")
                .append("rect")
                .attr("x", MARGIN.left)
                .attr("y", 0)
                .attr("width", innerWidth)
                .attr("height", innerHeight);
    }

    function setupTooltip() {
        let tooltip = d3.select(timelineContainer).select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select(timelineContainer)
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");
        }
        return tooltip;
    }

    function drawYAxis(svg) {
        const entries = Object.entries(visitMapping);
        const labelGroup = svg.append("g")
            .attr("transform", `translate(${MARGIN.left - 10}, ${MARGIN.top})`);

        labelGroup.selectAll("text")
            .data(entries)
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", ([id]) => visitMapping[id][0] * ROW_GAP + 10)
            .attr("text-anchor", "end")
            .attr("font-size", "11px")
            .attr("alignment-baseline", "middle")
            .text(([_, [, label]]) => label);

        const guideLines = svg.append("g")
            .attr("transform", `translate(0, ${MARGIN.top})`);

        guideLines.selectAll("line")
            .data(entries)
            .enter()
            .append("line")
            .attr("x1", MARGIN.left)
            .attr("x2", innerWidth + MARGIN.left)
            .attr("y1", ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
            .attr("y2", ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
    }

    function drawXAxis(svg) {
        const axis = d3.axisBottom(xScale).ticks(10);
        xAxisGroup = svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(axis);
    }

    function drawBars(svg, tooltip) {
        const barGroup = svg.append("g")
            .attr("transform", `translate(0,${MARGIN.top})`)
            .attr("clip-path", "url(#clip-timeline)");

        // Death bar
        if (personTable.death) {
            barGroup.append("rect")
            .attr("class", "death-bar")
            .attr("x", xScale(new Date(personTable.death.death_date)))
            .attr("y", 0)
            .attr("width", DEATH_BAR_WIDTH)
            .attr("height", innerHeight - 20)
            .attr("fill", "black")
            .attr("opacity", 1)
            .on("mouseover", (event) => showTooltip(event, tooltip, `death_concept : ${personTable.death.cause_concept_id}\ndeath_date : ${personTable.death.death_date}`))
            .on("mousemove", (event) => moveTooltip(event, tooltip))
            .on("mouseout", () => tooltip.style("visibility", "hidden"));
        }

        barGroup.selectAll("rect.visit-bar")
            .data(data.personVisits)
            .enter()
            .append("rect")
            .attr("class", "visit-bar")
            .attr("x", d => xScale(new Date(d.visit_start_date)))
            .attr("y", d => visitMapping[d.visit_concept_id]?.[0] * ROW_GAP)
            .attr("width", d => Math.max(xScale(new Date(d.visit_end_date)) - xScale(new Date(d.visit_start_date)), 5))
            .attr("height", BAR_HEIGHT)
            .attr("fill", d => visitMapping[d.visit_concept_id]?.[2] || "grey")
            .attr("stroke", "black")
            .attr("stroke-width", 0.1)
            .on("mouseover", (event, d) => showTooltip(event, tooltip, `Visit ID: ${d.visit_concept_id}\nStart: ${d.visit_start_date}\nEnd: ${d.visit_end_date}`))
            .on("mousemove", (event) => moveTooltip(event, tooltip))
            .on("mouseout", () => tooltip.style("visibility", "hidden"))
            .on("click", (event, d) => fetchDataById(d.visit_occurrence_id));
    }

    function showTooltip(event, tooltip, text) {
        tooltip.style("visibility", "visible")
            .style("white-space", "pre")
            .text(text);
    }

    function moveTooltip(event, tooltip) {
        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;
        const svgRect = timelineContainer.getBoundingClientRect();
        const pageX = event.clientX - svgRect.left;
        const pageY = event.clientY - svgRect.top;

        let tooltipX = pageX + 10;
        let tooltipY = pageY - 10;

        if (tooltipX + tooltipWidth > svgRect.width) tooltipX = pageX - tooltipWidth - 10;
        if (tooltipY + tooltipHeight > svgRect.height) tooltipY = pageY - tooltipHeight - 10;

        tooltip.style("top", `${tooltipY}px`).style("left", `${tooltipX}px`);
    }

    function setupZoom(svg, width, height) {
        const zoom = d3.zoom()
            .scaleExtent([0.5, 20])
            .translateExtent([[xScale.range()[0], 0], [xScale.range()[1], height]])
            .on("zoom", (event) => {
            const newXScale = event.transform.rescaleX(xScale);
            xAxisGroup.call(d3.axisBottom(newXScale));

            d3.selectAll(".visit-bar")
                .attr("x", d => newXScale(new Date(d.visit_start_date)))
                .attr("width", d => Math.max(newXScale(new Date(d.visit_end_date)) - newXScale(new Date(d.visit_start_date)), 5));

            d3.selectAll(".death-bar")
                .attr("x", newXScale(new Date(personTable.death.death_date)))
                .attr("width", DEATH_BAR_WIDTH);
            });

        svg.call(zoom);
    }

    function notify() {
        alert("테이블을 선택해주세요.");
    }

    onMount(() => {
        drawTimeline();

        const handleResize = () => {
            // 기존 svg 강제 삭제 후 다시 그리기
            const svg = d3.select(timelineContainer).select("svg");
            svg.remove();
            drawTimeline();
        };

        window.addEventListener("resize", handleResize);
        onDestroy(() => window.removeEventListener("resize", handleResize));
    });

    // ✅ 데이터 변경 시마다 실행
    $: if (data) {
        tick().then(() => drawTimeline());
        tableProps = {};
    }

    onDestroy(() => {
        const svg = d3.select(timelineContainer).select("svg");
        svg.on(".zoom", null); // ✅ 줌 이벤트 제거
        svg.remove();
    });
</script>

<header class="py-4 bg-white border-b w-full">
    <div class="flex justify-between py-2">
        <div class="flex items-center px-[10px] py-[5px] whitespace-nowrap">
            <span class="info"><strong>ID : </strong> {personTable.person_id}</span>
            <span class="divider">|</span>
            <span class="info"><strong>Gender : </strong> {genderCodes[personTable.gender_concept_id]}</span>
            <span class="divider">|</span>
            <span class="info"><strong>Date : </strong> {personTable.year_of_birth}.{personTable.month_of_birth}.{personTable.day_of_birth}</span>
        </div>
        <div class="flex rounded-full border border-gray-200 p-0.5 bg-gray-50 absolute right-14 top-6">
            <button 
                class="px-2 py-0.5 text-xs rounded-full transition-colors
                    {!isStatisticsView ? 
                        'bg-white text-blue-600 shadow-sm' : 
                        'text-gray-600 hover:text-gray-900'}"
                on:click={() => isStatisticsView = false}>
                Statistics
            </button>
            <button 
                class="px-2 py-0.5 text-xs rounded-full transition-colors
                    {isStatisticsView ? 
                        'bg-white text-blue-600 shadow-sm' : 
                        'text-gray-600 hover:text-gray-900'}"
                on:click={() => isStatisticsView = true}>
                Viewer
            </button>
        </div>
    </div>
    <!-- 🔹 타임라인을 렌더링할 컨테이너 -->
    <div class="w-full h-[200px] min-w-[850px]" bind:this={timelineContainer}></div>
</header>
<div class="pt-8 pb-[60px] flex flex-col gap-5">
    {#if !isStatisticsView}
        <div class="w-full">
            <div class="grid grid-cols-2 gap-4">
                <ChartCard
                    title="Visit Type Ratio"
                    description="The ratio of visits by visit type."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.visitTypeRatio}
                    on:toggleView={({ detail }) => isTableView.visitTypeRatio = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.statistics.visitType} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <DataTable
                                data={transformDonutChartToTableData({
                                    data: analysisData.statistics.visitType,
                                })}
                            />
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Departmet Visit Ratio"
                    description="The ratio of visits by department."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.departmentVisits}
                    on:toggleView={({ detail }) => isTableView.departmentVisits = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.statistics.departmentVisits} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <DataTable
                                data={transformDonutChartToTableData({
                                    data: analysisData.statistics.departmentVisits,
                                })}
                            />
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Top 10 Drugs"
                    description= "The list of the top 10 most frequently prescribed medications."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.topTenDrugs}
                    on:toggleView={({ detail }) => isTableView.topTenDrugs = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.statistics.topTenDrugs).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(analysisData.statistics.topTenDrugs).map(([name, count]) => ({ name, count }))}
                                domainKey="drug"
                            />
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Top 10 Conditions"
                    description="The list of the top 10 most frequently diagnosed medical conditions."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.topTenConditions}
                    on:toggleView={({ detail }) => isTableView.topTenConditions = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.statistics.topTenConditions).map(([name, count]) => ({ name, count }))}
                    />
                
                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(analysisData.statistics.topTenConditions).map(([name, count]) => ({ name, count }))}
                                domainKey="condition"
                            />
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Top 10 Procedures"
                    description="The list of the top 10 most frequently performed procedures and medical tests."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.topTenProcedures}
                    on:toggleView={({ detail }) => isTableView.topTenProcedures = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.statistics.topTenProcedures).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(analysisData.statistics.topTenProcedures).map(([name, count]) => ({ name, count }))}
                                domainKey="procedure"
                            />
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Top 10 Measurements"
                    description="The list of the top 10 most frequently recorded clinical measurements."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.topTenMeasurements}
                    on:toggleView={({ detail }) => isTableView.topTenMeasurements = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.statistics.topTenMeasurements).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(analysisData.statistics.topTenMeasurements).map(([name, count]) => ({ name, count }))}
                                domainKey="measurement"
                            />
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    {:else}
        <button 
            class="ml-auto mb-8 w-fit px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 ease-in-out"
                on:click={() => {
                    if(Object.keys(tableProps).length === 0){
                        notify();
                    }
                    else{
                        showModal = true
                    }
            }}>
            Select Tables
        </button>
        {#if tableProps?.cdm_info}
            <CDMInfo careSite={tableProps["cdm_info"].careSite} location={tableProps["cdm_info"].location} visitOccurrence={tableProps["cdm_info"].visitOccurrence} />
            {#each Array.from(selectedTables) as tableId}
                {#if tableComponents[tableId]}
                    <svelte:component this={tableComponents[tableId]} {...tableProps[tableId]} />
                {/if}
            {/each}
        {/if}
    {/if}
</div>

<Modal bind:isOpen={showModal} bind:selectedTables/>

<style>
    .info {
        font-weight: normal;
        font-size: 1.1rem;
        margin: 0 8px;
    }

    .divider {
        color: #888;
        font-weight: bold;
        margin: 0 8px;
    }
</style>