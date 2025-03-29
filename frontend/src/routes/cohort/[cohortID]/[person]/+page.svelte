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
    let selectedTables = new Set();
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
                drug: { drugEra: visitOccurrenceIdData.drug_era, drugExposure: visitOccurrenceIdData.drug_exposure, drugStrength: visitOccurrenceIdData.drug_strength },
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

    async function drawTimeline(){
        await tick();

        if (!timelineContainer) return;
        if (!data || !data.personVisits) return; // 데이터가 없으면 실행 X

        const width = timelineContainer.clientWidth;
        const height = timelineContainer.clientHeight;
        const margin = { top: 20, right: 20, bottom: 30, left: 130 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;


        let svg = d3.select(timelineContainer).select("svg");
        if (!svg.node()) {
            svg = d3.select(timelineContainer)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("border", "1px solid black");
        }
        svg.selectAll("*").remove(); // 내부만 제거

        // ✅ 클리핑 영역(clipPath) 추가
        svg.append("defs")
            .append("clipPath")
            .attr("id", "clip-timeline") // 클립 ID 설정
            .append("rect")
            .attr("x", margin.left)
            .attr("y", 0)
            .attr("width", innerWidth)
            .attr("height", innerHeight);

        // 🔹 툴팁 생성
        const tooltip = d3.select(timelineContainer)
            .append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

        const visitConceptEntries = Object.entries(visitMapping);

        // Y축 레이블 그룹
        const labelGroup = svg.append("g")
            .attr("transform", `translate(${margin.left - 10}, ${margin.top})`);

        labelGroup.selectAll("text")
            .data(visitConceptEntries)
            .enter()
            .append("text")
            .attr("x", 0) // 왼쪽 여백
            .attr("y", ([conceptId]) => visitMapping[conceptId][0] * 25 + 10) // yIndex 기준 위치
            .attr("text-anchor", "end")
            .attr("font-size", "11px")
            .attr("alignment-baseline", "middle")
            .text(([conceptId, [, label]]) => label);

        // Y축 배경 가이드라인 추가
        const guideLines = svg.append("g")
        .attr("transform", `translate(0, ${margin.top})`);

        guideLines.selectAll("line")
            .data(visitConceptEntries) // 또는 Object.entries(visitMapping)
            .enter()
            .append("line")
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("y1", ([conceptId]) => visitMapping[conceptId][0] * 25 - 2.5)
            .attr("y2", ([conceptId]) => visitMapping[conceptId][0] * 25 - 2.5)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1)

        // 🔹 최소/최대 날짜 계산
        let minStartDate = new Date(Math.min(...data.personVisits.map(d => new Date(d.visit_start_date))));
        let maxEndDate = new Date(Math.max(...data.personVisits.map(d => new Date(d.visit_end_date))));
        minStartDate.setDate(minStartDate.getDate() - 360);
        minStartDate.setHours(0, 0, 0, 0);
        maxEndDate.setHours(23, 59, 59, 999);
        maxEndDate.setDate(maxEndDate.getDate() + 360);

        // 🔹 X축 스케일 설정
        const xScale = d3.scaleTime()
            .domain([minStartDate, maxEndDate])
            .range([margin.left, width - margin.right]);

        // 🔹 X축 생성
        const xAxis = d3.axisBottom(xScale).ticks(10);
        const xAxisGroup = svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis);

        // 🔹 바(bar) 추가 (클리핑 적용)
        const barGroup = svg.append("g")
            .attr("transform", `translate(0,${margin.top})`)
            .attr("clip-path", "url(#clip-timeline)"); // ✅ 클리핑 적용
            

        // Death가 null이 아니면 추가
        if (personTable.death) {
            barGroup.append("rect")
                .attr("class", "death-bar")
                .attr("x", xScale(new Date(personTable.death.death_date))) // 시작일 기준
                .attr("y", 0) // 전체 barGroup 내에서 상단부터
                .attr("width", 5)
                .attr("height", innerHeight - 20) // 전체 영역 덮도록
                .attr("fill", "black")
                .attr("opacity", 1) // 배경처럼 보이게
                .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .style("white-space", "pre")
                    .text(`death_concept : ${personTable.death.cause_concept_id}\ndeath_date : ${personTable.death.death_date}`);
                })
                .on("mousemove", (event) => {
                    const tooltipWidth = tooltip.node().offsetWidth;
                    const tooltipHeight = tooltip.node().offsetHeight;

                    const svgRect = timelineContainer.getBoundingClientRect();
                    const pageX = event.clientX - svgRect.left; // 컨테이너 내부 상대 좌표
                    const pageY = event.clientY - svgRect.top;  // 컨테이너 내부 상대 좌표
                    
                    let tooltipX = pageX + 10; // 기본적으로 오른쪽에 표시
                    let tooltipY = pageY - 10; // 기본적으로 마우스보다 약간 위로 표시

                    // ✅ 툴팁이 오른쪽 화면을 넘어가는 경우 -> 왼쪽에 표시
                    if (tooltipX + tooltipWidth > svgRect.width) {
                        tooltipX = pageX - tooltipWidth - 10;
                    }

                    // ✅ 툴팁이 아래 화면을 넘어가는 경우 -> 위로 표시
                    if (tooltipY + tooltipHeight > svgRect.height) {
                        tooltipY = pageY - tooltipHeight - 10;
                    }

                    tooltip.style("top", `${tooltipY}px`)
                            .style("left", `${tooltipX}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                });
        }

        barGroup.selectAll("rect.visit-bar")
            .data(data.personVisits)
            .enter()
            .append("rect")
            .attr("class", "visit-bar")
            .attr("x", d => xScale(new Date(d.visit_start_date)))
            .attr("y", d => visitMapping[d.visit_concept_id]?.[0] * 25)
            .attr("width", d => {
                let startX = xScale(new Date(d.visit_start_date));
                let endX = xScale(new Date(d.visit_end_date));
                return Math.max(endX - startX, 5);
            })
            .attr("height", 20)
            .attr("fill", d => visitMapping[d.visit_concept_id]?.[2] || "grey")
            .attr("stroke", "black")
            .attr("stroke-width", 0.1)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .style("white-space", "pre")
                    .text(`Visit ID: ${d.visit_concept_id}\nStart: ${d.visit_start_date}\nEnd: ${d.visit_end_date}`);
            })
            .on("mousemove", (event) => {
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;

                const svgRect = timelineContainer.getBoundingClientRect();
                const pageX = event.clientX - svgRect.left; // 컨테이너 내부 상대 좌표
                const pageY = event.clientY - svgRect.top;  // 컨테이너 내부 상대 좌표
                
                let tooltipX = pageX + 10; // 기본적으로 오른쪽에 표시
                let tooltipY = pageY - 10; // 기본적으로 마우스보다 약간 위로 표시

                // ✅ 툴팁이 오른쪽 화면을 넘어가는 경우 -> 왼쪽에 표시
                if (tooltipX + tooltipWidth > svgRect.width) {
                    tooltipX = pageX - tooltipWidth - 10;
                }

                // ✅ 툴팁이 아래 화면을 넘어가는 경우 -> 위로 표시
                if (tooltipY + tooltipHeight > svgRect.height) {
                    tooltipY = pageY - tooltipHeight - 10;
                }

                tooltip.style("top", `${tooltipY}px`)
                        .style("left", `${tooltipX}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            })
            .on("click", (event, d) => {
                fetchDataById(d.visit_occurrence_id);
            });

        // 🔹 줌(Zoom) 기능 추가
        const zoom = d3.zoom()
            .scaleExtent([0.5, 20]) // 최소 0.5배, 최대 5배 확대 가능
            .translateExtent([[xScale(minStartDate), 0], [xScale(maxEndDate), height]]) // 🚀 최소/최대 날짜 기준으로 이동 제한
            .on("zoom", (event) => {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale); // ✅ 기존 xScale을 변환하여 새로운 xScale 생성

                xAxisGroup.call(d3.axisBottom(newXScale)); // ✅ X축 업데이트

                barGroup.selectAll("rect.visit-bar")
                    .attr("x", d => newXScale(new Date(d.visit_start_date)))
                    .attr("width", d => {
                        let startX = newXScale(new Date(d.visit_start_date));
                        let endX = newXScale(new Date(d.visit_end_date));
                        return Math.max(endX - startX, 5); // ✅ zoom 시 width 유지
                    });
                
                barGroup.selectAll("rect.death-bar")
                    .attr("x", d => newXScale(new Date(personTable.death.death_date)))
                    .attr("width", 5);
            });

        svg.call(zoom); // ✅ SVG에 zoom 기능 적용
    }

    // ✅ 화면 크기 변경 감지 → 타임라인 다시 그리기
    onMount(() => {
        drawTimeline();
        window.addEventListener("resize", drawTimeline);
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
    <div class="w-full h-[200px]" bind:this={timelineContainer}></div>
</header>
<div class="pt-8 pb-[60px] flex flex-col">
    {#if !isStatisticsView}
        <!-- <button 
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
        </button> -->
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



        {#if tableProps?.cdm_info}
            <CDMInfo careSite={tableProps["cdm_info"].careSite} location={tableProps["cdm_info"].location} visitOccurrence={tableProps["cdm_info"].visitOccurrence} />
            <svelte:component this={tableComponents[tableId]} {...tableProps[tableId]} />
        {/if}
        {#each Array.from(selectedTables) as tableId}
            {#if tableComponents[tableId]}
                <svelte:component this={tableComponents[tableId]} {...tableProps[tableId]} />
            {/if}
        {/each}
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