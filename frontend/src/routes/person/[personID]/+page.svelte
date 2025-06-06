<script>
    import { onMount, onDestroy, tick } from "svelte";
    import { slide } from 'svelte/transition';
    import { get } from 'svelte/store'
    import { page } from '$app/stores'
    import CDMInfo from "$lib/components/Table/CDMInfo.svelte";
    import Condition from "$lib/components/Table/Condition.svelte";
    import Drug from "$lib/components/Table/Drug.svelte";
    import Measurement from "$lib/components/Table/Measurement.svelte";
    import Observation from "$lib/components/Table/Observation.svelte";
    import ProcedureOccurrence from "$lib/components/Table/ProcedureOccurrence.svelte";
    import Specimen from "$lib/components/Table/Specimen.svelte";
    import BioSignal from "$lib/components/Table/BioSignal.svelte";
    import * as d3 from "d3";
    import Footer from '$lib/components/Footer.svelte';
    import LoadingComponent from "$lib/components/LoadingComponent.svelte";
    import ChartCard from '$lib/components/ChartCard.svelte';
    import DataTable from '$lib/components/DataTable.svelte';
    import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
    import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';
    import { transformDonutChartToTableData } from '$lib/components/Charts/DonutChart/donutChartTransformer.js';
    import BarChart from "$lib/components/Charts/BarChart/BarChart.svelte"
    import BarChartWrapper from "$lib/components/Charts/BarChart/BarChartWrapper.svelte"
    import BarChartTableView from '$lib/components/Charts/BarChart/BarChartTableView.svelte';
    import { PUBLIC_API_URI } from '$env/static/public';
    let timelineContainer;
    let selectedGroup = null;
    let isSelectTableOpen = false;
    let isStatisticsView = false;
    let show = false;
    let cohortIdFromUrl;
    let isLoading = true;
    $: personID = $page.params.personID;

    let message = ""
    let personTable = [];
    let personVisits = [];
    let personStatistics = [];

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

    let selectItems = [ // default 차트에서 차트 선택 박스
        {id: 'condition', name: 'Condition', checked: true},
        {id: 'drug', name: 'Drug', checked: true},
        {id: 'measurement', name: 'Measurement', checked: true},
        {id: 'observation', name: 'Observation', checked: true},
        {id: 'procedure_occurrence', name: 'Procedure Occurrence', checked: true},
        {id: 'specimen', name: 'Specimen', checked: true},
        {id: 'bio_signal', name: 'Bio Signal', checked: true},
    ];

    //   데이터 매칭 (각 테이블에 해당하는 props 설정)
    let tableProps = {};

    const visitMapping = {
        262: [0, "Emergency Room - Inpatient Visit", "#FF6B6B"],
        8870: [1, "Emergency Room - Hospital", "#4ECDC4"],
        8883: [2, "Ambulatory Surgical Center", "#FFB236"],
        9201: [3, "Inpatient Visit", "#95A5A6"],
        581385: [4, "Observation Room", "#BDC3C7"],
        38004207: [5, "Ambulatory Clinic / Center", "#BD12C7"],
    };

    async function fetchDataById(id) {
        isLoading = true;
        isStatisticsView = true;
        message = "Loading Table...";
        try {
            const res = await fetch(`${PUBLIC_API_URI}/api/visit/${id}/`);
            const fullData = await res.json();
            tableProps = {
                cdm_info: { careSite: fullData?.care_site, location: fullData?.location, visitOccurrence: fullData?.visitInfo },
                condition: { conditionEra: fullData?.conditionEras, conditionOccurrence: fullData?.conditions },
                drug: { drugExposure: fullData?.drugs },
                measurement: { measurement: fullData?.measurements },
                observation: { observation: fullData?.observations },
                procedure_occurrence: { procedureOccurrence: fullData?.procedures },
                specimen: { specimen: fullData?.specimens },
                bio_signal: { bioSignal: fullData?.bio_signal }
            };
            console.log("tableProps", tableProps);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        } finally{
            isLoading = false;
            drawTimeline();
        }
    }

    const MARGIN = { top: 20, right: 20, bottom: 30, left: 130 };
    const BAR_HEIGHT = 20;
    const ROW_GAP = 25;
    const DEATH_BAR_WIDTH = 5;

    let xScale, xAxisGroup, innerWidth, innerHeight;

    async function drawTimeline() {

        await tick();
        if (!timelineContainer || !personVisits) return;
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
            .style("border", "1px solid #d1d5db")
            .style("border-radius", "6px")
            .style("box-shadow", "0 1px 3px rgba(0, 0, 0, 0.1)");
        }
        svg.selectAll("*").remove();
        return svg;
    }

    function setupScales(width) {
        let minStart = new Date(Math.min(...personVisits.map(d => new Date(d.visit_start_date))));
        let maxEnd = new Date(Math.max(...personVisits.map(d => new Date(d.visit_end_date))));
        minStart.setDate(minStart.getDate() - 360);
        minStart.setHours(0, 0, 0, 0);
        maxEnd.setHours(23, 59, 59, 999);
        maxEnd.setDate(maxEnd.getDate() + 360);

        return d3.scaleTime()
            .domain([minStart, maxEnd])
            .range([MARGIN.left, width - MARGIN.right - 50]);
    }

    function setupClipPath(svg) {
        svg.append("defs")
            .append("clipPath")
            .attr("id", "clip-timeline")
            .append("rect")
            .attr("x", MARGIN.left + 50)
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
            .attr("transform", `translate(${MARGIN.left+50}, ${MARGIN.top})`);

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
            .attr("x1", MARGIN.left + 50)
            .attr("x2", innerWidth + MARGIN.left)
            .attr("y1", ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
            .attr("y2", ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
    }

    function drawXAxis(svg) {
        const axis = d3.axisBottom(xScale).ticks(10);
        xAxisGroup = svg.append("g")
            .attr("transform", `translate(50,${innerHeight})`)
            .call(axis);
    }

    function darkenColor(hex, amount = 0.1) {
        const color = d3.color(hex);
        if (!color) return hex;

        const hsl = d3.hsl(color);
        hsl.l = Math.max(0, hsl.l - amount); // lightness 낮추기 (0~1)
        return hsl.formatHex();
    }

    function drawBars(svg, tooltip) {
        const barGroup = svg.append("g")
            .attr("transform", `translate(0,${MARGIN.top})`)
            .attr("clip-path", "url(#clip-timeline)");

        const grouped = groupOverlappingVisits(personVisits);

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
            .data(grouped)
            .enter()
            .append("rect")
            .attr("class", "visit-bar")
            .attr("x", d => xScale(new Date(d.start))) // ← 수정
            .attr("y", d => {
                // 첫 번째 visit 기준으로 y 위치 설정
                const visit = d.items[0];
                return visitMapping[visit.visit_concept_id]?.[0] * ROW_GAP;
            })
            .attr("width", d => {
                const len = d.items.length;
                const visit = d.items[0];
                const visit2 = d.items[len - 1];
                return Math.max(xScale(new Date(visit2.visit_end_date)) - xScale(new Date(visit.visit_start_date)), 5);
            }) // ← 수정
            .attr("height", BAR_HEIGHT)
            .attr("fill", d => {
                const visit = d.items[0];
                const baseColor = visitMapping[visit.visit_concept_id]?.[2] || "#ccc";
                const count = d.items.length;

                if (count === 1) return baseColor;
                if (count <= 2) return darkenColor(baseColor, 0.2);
                if (count <= 4) return darkenColor(baseColor, 0.3);
                return darkenColor(baseColor, 0.4); // 5개 이상
            })
            .on("mouseover", (event, d) => {
                const visit = d.items[0];
                const len = d.items.length;
                if(len == 1){
                    showTooltip(event, tooltip, `Start: ${visit.visit_start_date}\nEnd: ${visit.visit_end_date}\nCount: ${len}`);
                } else{
                    const visit2 = d.items[len-1];
                    showTooltip(event, tooltip, `Start: ${visit.visit_start_date}\nEnd: ${visit2.visit_end_date}\nCount: ${len}`);
                }
            })
            .on("mousemove", (event, d) => {
                const visit = d.items[0];
                moveTooltip(event, tooltip)
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"))
            .on("click", (event, d) => {
                const len = d.items.length;
                if(len != 1){
                    selectedGroup = d.items; // 유지
                } else{
                    selectedGroup = null; // 유지
                    fetchDataById(d.items[0].visit_occurrence_id); // 첫 visit 기준 호출
                }
            });

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
        let tooltipY = pageY - 30;

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
                .attr("x", d => newXScale(new Date(d.start)))
                .attr("width", d => Math.max(newXScale(new Date(d.end)) - newXScale(new Date(d.start)), 5));

            d3.selectAll(".death-bar")
                .attr("x", newXScale(new Date(personTable.death?.death_date)))
                .attr("width", DEATH_BAR_WIDTH);
            });

        svg.call(zoom);
    }

    function toggleSelectTable() {
        isSelectTableOpen = !isSelectTableOpen;
    }

    function handleCheckboxChange(item) { // Select Chart 드롭다운 메뉴에서 체크박스 상태 변경 함수
        item.checked = !item.checked;
        selectItems = selectItems; // Svelte 반응성을 위한 재할당
    }

    function groupOverlappingVisits(visits) {
        const groups = [];

        // Step 1: visit_concept_id로 먼저 그룹화
        const visitsByType = d3.group(visits, d => d.visit_concept_id);

        // Step 2: 각 타입별로 시간 겹침 계산
        visitsByType.forEach((typeVisits, conceptId) => {
            // 시간 순 정렬
            const sorted = typeVisits.slice().sort((a, b) => new Date(a.visit_start_date) - new Date(b.visit_start_date));
            const typeGroups = [];

            for (const visit of sorted) {
                const vStart = new Date(visit.visit_start_date);
                const vEnd = new Date(visit.visit_end_date);
                let placed = false;

                for (const group of typeGroups) {
                    const gEnd = new Date(group.end);
                    if (vStart <= gEnd) {
                        group.items.push(visit);
                        group.end = new Date(Math.max(gEnd, vEnd)); // update end if needed
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    typeGroups.push({
                        start: vStart,
                        end: vEnd,
                        visit_concept_id: conceptId, // 유지!
                        items: [visit]
                    });
                }
            }

            groups.push(...typeGroups);
        });

        return groups;
    }

    async function fetchData(){
        isLoading = true;
        message = "Loading data...";
        try{
            const res = await fetch(`${PUBLIC_API_URI}/api/person/${personID}/`);
            if (!res.ok) {
                throw new Error('Failed to fetch data');
            }
            personTable = await res.json();
            
            const res2 = await fetch(`${PUBLIC_API_URI}/api/person/${personID}/visit/`);
            if (!res2.ok) {
                throw new Error('Failed to fetch data');
            }
            personVisits = await res2.json();

            const res3 = await fetch(`${PUBLIC_API_URI}/api/person/${personID}/statistics/`)
            if (!res3.ok) {
                throw new Error('Failed to fetch data');
            }
            personStatistics = await res3.json();
        }
        catch (error) {
            console.error("데이터 로드 실패:", error);
        }
        finally {
            isLoading = false;
            drawTimeline();
        }
    }

    onMount(async() => {
        await fetchData();
        await tick();
        cohortIdFromUrl = get(page).params.cohortID;


        const handleResize = () => {
            // 기존 svg 강제 삭제 후 다시 그리기
            const svg = d3.select(timelineContainer).select("svg");
            svg.remove();
            drawTimeline();
        };

        window.addEventListener("resize", handleResize);
    });

    $: if (personID) {
        (async () => {
            await fetchData();
            tableProps = {};
        })();
    }

    onDestroy(() => {
        const svg = d3.select(timelineContainer).select("svg");
        svg.on(".zoom", null); // ✅ 줌 이벤트 제거
        svg.remove();
    });
</script>


{#if isLoading}
    <LoadingComponent message={message}/>
{:else}
<header class="py-4 bg-white border-b w-full">
    <div class="flex justify-between items-center py-2">
        <div class="flex items-center px-[10px] py-[5px] whitespace-nowrap">
            <a href="/cohort/{cohortIdFromUrl}" aria-label="go back">
                <button class="flex items-center pr-[10px]" aria-label="go back">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-gray-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </a>
            <span class="text-sm text-gray-400">ID</span>
            <span class="text-sm font-medium text-gray-900 ml-1">{personTable.info.person_id}</span>
            <span class="text-gray-200 mx-3">|</span>
            <span class="text-sm text-gray-400">Gender</span>
            <span class="text-sm font-medium text-gray-900 ml-1">{genderCodes[personTable.info.gender_concept_id]}</span>
            <span class="text-gray-200 mx-3">|</span>
            <span class="text-sm text-gray-400">Birth(Year)</span>
            <!-- <span class="text-sm font-medium text-gray-900 ml-1">{personTable.info.year_of_birth}.{personTable.info.month_of_birth}.{personTable.info.day_of_birth}</span> -->
            <span class="text-sm font-medium text-gray-900 ml-1">{personTable.info.year_of_birth}</span>
        </div>
        <div class="flex rounded-full border border-gray-200 p-0.5 bg-gray-50 mr-2 h-fit">
            <button 
                class="px-2 py-0.5 text-xs rounded-full transition-colors
                    {!isStatisticsView ? 
                        'text-blue-600' : 
                        'text-gray-600 hover:text-gray-900'}"
                on:click={() => isStatisticsView = false}>
                Statistics
            </button>
        </div>
    </div>
    <!-- 🔹 타임라인을 렌더링할 컨테이너 -->
    <div class="flex gap-4">
        <div class="w-4/5 h-[220px] min-w-[850px] relative" bind:this={timelineContainer}></div>
        <div class="w-1/5 border rounded-lg p-4 bg-white shadow-md h-[220px] overflow-y-auto">
            <h2 class="text-lg font-bold mb-2">Overlapping Visits</h2>
            {#if selectedGroup}
                <ul class="space-y-2">
                    {#each selectedGroup as visit}
                        <li class="block hover:bg-gray-100 text-sm border-b pb-1">
                            <button class="w-full text-left" on:click={fetchDataById(visit.visit_occurrence_id)}>
                                <strong>ID:</strong> {visit.visit_concept_id}<br/>
                                <strong>Start:</strong> {visit.visit_start_date}<br/>
                                <strong>End:</strong> {visit.visit_end_date}
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-sm text-gray-500">Click on a bar to view details.</p>
            {/if}
        </div>
    </div>
</header>
<div class="pt-8 pb-[60px] flex flex-col gap-5">
    {#if !isStatisticsView}
        <div class="w-full">
            <div class="grid grid-cols-6 gap-4">
                <ChartCard
                    title="Visit Type Ratio"
                    description="The ratio of visits by visit type."
                    type="half"
                    hasTableView={true}
                    hasXButton={false}
                    isTableView={isTableView.visitTypeRatio}
                    on:toggleView={({ detail }) => isTableView.visitTypeRatio = detail}
                >
                    <SingleDonutChartWrapper data={personStatistics.visitType} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <DataTable
                                data={transformDonutChartToTableData({
                                    data: personStatistics.visitType,
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
                    hasXButton={false}
                    isTableView={isTableView.departmentVisits}
                    on:toggleView={({ detail }) => isTableView.departmentVisits = detail}
                >
                    <SingleDonutChartWrapper data={personStatistics.departmentVisit} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <DataTable
                                data={transformDonutChartToTableData({
                                    data: personStatistics.departmentVisit,
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
                    hasXButton={false}
                    isTableView={isTableView.topTenDrugs}
                    on:toggleView={({ detail }) => isTableView.topTenDrugs = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(personStatistics.topTenDrug).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(personStatistics.topTenDrug).map(([name, count]) => ({ name, count }))}
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
                    hasXButton={false}
                    isTableView={isTableView.topTenConditions}
                    on:toggleView={({ detail }) => isTableView.topTenConditions = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(personStatistics.topTenCondition).map(([name, count]) => ({ name, count }))}
                    />
                
                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(personStatistics.topTenCondition).map(([name, count]) => ({ name, count }))}
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
                    hasXButton={false}
                    isTableView={isTableView.topTenProcedures}
                    on:toggleView={({ detail }) => isTableView.topTenProcedures = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(personStatistics.topTenProcedure).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(personStatistics.topTenProcedure).map(([name, count]) => ({ name, count }))}
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
                    hasXButton={false}
                    isTableView={isTableView.topTenMeasurements}
                    on:toggleView={({ detail }) => isTableView.topTenMeasurements = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(personStatistics.topTenMeasurement).map(([name, count]) => ({ name, count }))}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <div class="flex-1 overflow-x-auto overflow-y-auto">
                            <BarChartTableView
                                data={Object.entries(personStatistics.topTenMeasurement).map(([name, count]) => ({ name, count }))}
                                domainKey="measurement"
                            />
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    {:else}
        <div class="relative flex justify-end mb-2">
            <button 
                class="px-4 py-2 ml-auto w-fit text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                on:click|stopPropagation={toggleSelectTable}
            >
                <span>{isSelectTableOpen ? '▲' : '▼'} Select Tables</span>
            </button>
            {#if isSelectTableOpen}
                <div class="absolute right-0 top-full z-50 min-w-[250px] bg-white border border-gray-300 rounded-lg shadow-md p-4" transition:slide>
                    <div class="flex flex-col gap-3">
                        {#each selectItems as item}
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    on:change={() => handleCheckboxChange(item)}
                                    class="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                    <span class="text-sm text-gray-700">{item.name}</span>
                            </label>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        {#if tableProps?.cdm_info}
            <CDMInfo careSite={tableProps["cdm_info"].careSite} location={tableProps["cdm_info"].location} visitOccurrence={tableProps["cdm_info"].visitOccurrence} />
            {#each Array.from(selectItems) as tableId}
                {#if tableId.checked}
                    <svelte:component this={tableComponents[tableId.id]} {...tableProps[tableId.id]} />
                {/if}
            {/each}
        {/if}
    {/if}
    <Footer />
</div>
{/if}