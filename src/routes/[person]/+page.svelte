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
    import * as d3 from "d3";
    import cdmSample from "$lib/data/cdm_sample_data.json";
    let timelineContainer;
    
    const personTable = cdmSample.person;
    const bar_colors = {
        9201: "#FF0000", // 빨강
        9202: "#FF7F00", // 주황
        9203: "#FFFF00", // 노랑
        581477: "#00FF00", // 초록
        44818517: "#0000FF", // 파랑
    };

    const visitTypes = {
        9201: "Inpatient",
        9202: "Outpatient",
        9203: "Emergency Room Visit",
        581477: "Home Visit",
        44818517: "Other Visit Type"
    };

    export let data;
        
    function calculateYPositions(data) {
        let rows = [];
        const maxRows = 5; // ✅ 최대 Y축 줄 개수 제한
        const xOffset = 3; // ✅ 가로 이동 간격

        // ✅ 시작일 기준으로 정렬
        data.sort((a, b) => new Date(a.visit_start_date) - new Date(b.visit_start_date));

        data.forEach(d => {
            let start = new Date(d.visit_start_date);
            let end = new Date(d.visit_end_date);
            let placed = false;

            // ✅ 현재 데이터를 배치할 수 있는 가장 낮은 yIndex 찾기
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                let row = rows[rowIndex];

                let hasOverlap = row.some(item =>
                    new Date(item.visit_end_date) >= start  // 종료일이 현재 시작일 이후까지 지속되면 겹침
                );

                if (!hasOverlap) {
                    row.push(d);
                    d.yIndex = rowIndex;
                    d.xOffset = 0;
                    placed = true;
                    break;
                }
            }

            // ✅ 기존 row에 배치되지 않은 경우 새 row 추가
            if (!placed) {
                if (rows.length < maxRows) {
                    rows.push([d]);
                    d.yIndex = rows.length - 1;
                    d.xOffset = 0;
                } else {
                    // ✅ 최대 줄 개수를 넘으면 xOffset을 증가시켜 가로 이동
                    let sameDateItems = rows[maxRows - 1].filter(item =>
                        new Date(item.visit_start_date) < end && new Date(item.visit_end_date) > start
                    );
                    d.yIndex = maxRows - 1;
                    d.xOffset = sameDateItems.length * xOffset;
                    rows[maxRows - 1].push(d);
                }
            }
        });

        return data;
    }




    async function drawTimeline(){
        await tick();

        if (!timelineContainer) return;
        if (!data || !data.personVisits) return; // 데이터가 없으면 실행 X

        const width = timelineContainer.clientWidth;
        const height = timelineContainer.clientHeight;
        const margin = { top: 20, right: 20, bottom: 30, left: 50 };
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

        // 🔹 범례 추가
        const legendData = Object.entries(bar_colors);
        const legend = svg.append("g")
            .attr("transform", `translate(10, 10)`);

        legend.selectAll("g")
            .data(legendData)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(0, ${i * 12})`)
            .each(function (d) {
                d3.select(this)
                    .append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", d[1]);

                d3.select(this)
                    .append("text")
                    .attr("x", 15)
                    .attr("y", 9)
                    .attr("font-size", "10px")
                    .text(`${visitTypes[d[0]] || "Unknown Type"}`);
            });

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
            
        let processedData = calculateYPositions(data.personVisits);
        barGroup.selectAll("rect")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(new Date(d.visit_start_date)))
            .attr("y", d => 10 + d.yIndex * 25) // 🚀 같은 줄에 배치되면 y값 유지, 겹치면 다음 줄로 이동
            .attr("width", d => {
                let startX = xScale(new Date(d.visit_start_date));
                let endX = xScale(new Date(d.visit_end_date));
                return Math.max(endX - startX, 5);
            })
            .attr("height", 20)
            .attr("fill", d => bar_colors[d.visit_concept_id] || "grey")
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
        // window.removeEventListener("resize", drawTimeline);
    });
</script>

<header class="fixed w-full py-4 px-6 bg-white border-b">
    <div class="flex items-center px-[10px] py-[5px] whitespace-nowrap">
        <span class="info"><strong>ID : </strong> {personTable[0].person_id}</span>
        <span class="divider">|</span>
        <span class="info"><strong>Gender : </strong> {personTable[0].gender_concept_id}</span>
        <span class="divider">|</span>
        <span class="info"><strong>Date : </strong> {personTable[0].year_of_birth}.{personTable[0].month_of_birth}.{personTable[0].day_of_birth}</span>
      </div>
    <!-- 🔹 타임라인을 렌더링할 컨테이너 -->
    <div class="w-[89%] h-[200px]" bind:this={timelineContainer}></div>
</header>
<div class="pt-[300px] pl-[16px] pr-[16px] pb-[16px]">
    <CDMInfo careSite={cdmSample.care_site} location={cdmSample.location} visitOccurrence={cdmSample.visit_occurrence} />
    <Condition conditionEra={cdmSample.condition_era} conditionOccurrence={cdmSample.condition_occurrence}/>
    <Drug drugEra={cdmSample.drug_era} drugExposure={cdmSample.drug_exposure} drugStrength={cdmSample.drug_strength}/>
    <Measurement measurement={cdmSample.measurement}/>
    <Observation observation={cdmSample.observation}/>
    <ProcedureOccurrence procedureOccurrence={cdmSample.procedure_occurrence}/>
    <Specimen specimen={cdmSample.specimen}/>
    <BioSignal bioSignal={cdmSample.bio_signal}/>
</div>

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