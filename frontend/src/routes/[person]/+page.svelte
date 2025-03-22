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
    import cdmSample from "$lib/data/cdm_sample_data.json";

    let timelineContainer;
    let showModal = false;
    let selectedTables = new Set();
    export let data;
    
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
      // 데이터 매칭 (각 테이블에 해당하는 props 설정)
    const tableProps = {
        cdm_info: { careSite: cdmSample.care_site, location: cdmSample.location, visitOccurrence: cdmSample.visit_occurrence },
        condition: { conditionEra: cdmSample.condition_era, conditionOccurrence: cdmSample.condition_occurrence },
        drug: { drugEra: cdmSample.drug_era, drugExposure: cdmSample.drug_exposure, drugStrength: cdmSample.drug_strength },
        measurement: { measurement: cdmSample.measurement },
        observation: { observation: cdmSample.observation },
        procedure_occurrence: { procedureOccurrence: cdmSample.procedure_occurrence },
        specimen: { specimen: cdmSample.specimen },
        bio_signal: { bioSignal: cdmSample.bio_signal }
    };
    const personTable = cdmSample.person;

    const visitMapping = {
        9201: [0, "Inpatient", "#FF0000"],
        9202: [1, "Outpatient", "#FF7F00"],
        9203: [2, "Emergency Room Visit", "#FFFF00"],
        581477: [3, "Home Visit", "#00FF00"],
        44818517: [4, "Other Visit Type", "#0000FF"]
    };

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
            
        barGroup.selectAll("rect")
            .data(data.personVisits)
            .enter()
            .append("rect")
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
            .attr("stroke-width", 1)
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
                if (tooltipX + tooltipWidth > window.innerWidth) {
                    tooltipX = pageX - tooltipWidth - 10;
                }

                // ✅ 툴팁이 아래 화면을 넘어가는 경우 -> 위로 표시
                if (tooltipY + tooltipHeight > window.innerHeight) {
                    tooltipY = pageY - tooltipHeight - 10;
                }

                tooltip.style("top", `${tooltipY}px`)
                        .style("left", `${tooltipX}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // 🔹 줌(Zoom) 기능 추가
        const zoom = d3.zoom()
            .scaleExtent([0.5, 20]) // 최소 0.5배, 최대 5배 확대 가능
            .translateExtent([[xScale(minStartDate), 0], [xScale(maxEndDate), height]]) // 🚀 최소/최대 날짜 기준으로 이동 제한
            .on("zoom", (event) => {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale); // ✅ 기존 xScale을 변환하여 새로운 xScale 생성

                xAxisGroup.call(d3.axisBottom(newXScale)); // ✅ X축 업데이트

                barGroup.selectAll("rect")
                    .attr("x", d => newXScale(new Date(d.visit_start_date)))
                    .attr("width", d => {
                        let startX = newXScale(new Date(d.visit_start_date));
                        let endX = newXScale(new Date(d.visit_end_date));
                        return Math.max(endX - startX, 5); // ✅ zoom 시 width 유지
                    });
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
    }

    onDestroy(() => {
        const svg = d3.select(timelineContainer).select("svg");
        svg.on(".zoom", null); // ✅ 줌 이벤트 제거
        svg.remove();
    });
</script>

<header class="fixed w-[89%] py-4 px-6 bg-white border-b">
    <div class="flex justify-between py-2">
        <div class="flex items-center px-[10px] py-[5px] whitespace-nowrap">
            <span class="info"><strong>ID : </strong> {personTable[0].person_id}</span>
            <span class="divider">|</span>
            <span class="info"><strong>Gender : </strong> {genderCodes[personTable[0].gender_concept_id]}</span>
            <span class="divider">|</span>
            <span class="info"><strong>Date : </strong> {personTable[0].year_of_birth}.{personTable[0].month_of_birth}.{personTable[0].day_of_birth}</span>
        </div>
        <button 
            class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md 
                    hover:bg-blue-700 transition-all duration-200 ease-in-out"
            on:click={() => showModal = true}>
        Select Tables
        </button>
    </div>
    <!-- 🔹 타임라인을 렌더링할 컨테이너 -->
    <div class="w-full h-[200px]" bind:this={timelineContainer}></div>
</header>
<div class="pt-[300px] pl-[16px] pr-[16px] pb-[16px]">
    <CDMInfo careSite={cdmSample.care_site} location={cdmSample.location} visitOccurrence={cdmSample.visit_occurrence} />
    {#each Array.from(selectedTables) as tableId}
        {#if tableComponents[tableId]}
        <svelte:component this={tableComponents[tableId]} {...tableProps[tableId]} />
        {/if}
    {/each}
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