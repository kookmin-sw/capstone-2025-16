<script>
    import { onMount, onDestroy, tick } from "svelte";
    import * as d3 from "d3";

    let timelineContainer;

    const bar_colors = {
        9201: "#FF0000", // 빨강
        9202: "#FF7F00", // 주황
        9203: "#FFFF00", // 노랑
        581477: "#00FF00", // 초록
        44818517: "#0000FF", // 파랑
    };

    export let data;
        
    
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
                    .text(`ID: ${d[0]}`);
            });

        // 🔹 최소/최대 날짜 계산
        let minStartDate = new Date(Math.min(...data.personVisits.map(d => new Date(d.visit_start_date))));
        let maxEndDate = new Date(Math.max(...data.personVisits.map(d => new Date(d.visit_end_date))));
        minStartDate.setDate(minStartDate.getDate() - 30);
        minStartDate.setHours(0, 0, 0, 0);
        maxEndDate.setHours(23, 59, 59, 999);
        maxEndDate.setDate(maxEndDate.getDate() + 30);

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
            .attr("x", d => xScale(new Date(d.visit_start_date))) // 정확한 X축 위치 조정
            .attr("y", 10)
            .attr("width", d => {
                let startX = xScale(new Date(d.visit_start_date));
                let endX = xScale(new Date(d.visit_end_date));
                return Math.max(endX - startX, 5); // 🔥 최소 width 5 보장
            })
            .attr("height", 20)
            .attr("fill", d => bar_colors[d.visit_concept_id] || "grey")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .style("white-space", "pre")
                    .text(`Visit ID: ${d.visit_concept_id}\nStart: ${d.visit_start_date}\nEnd: ${d.visit_end_date}`);
            })
            .on("mousemove", (event) => {
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;
                const pageX = event.pageX;
                const pageY = event.pageY;
                
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
            .scaleExtent([0.5, 5]) // 최소 0.5배, 최대 5배 확대 가능
            .translateExtent([[margin.left, 0], [width - margin.right, height]])
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

    // ✅ 마운트 시 실행
    onMount(drawTimeline);

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

<!-- 🔹 타임라인을 렌더링할 컨테이너 -->
<div class="w-full h-[200px]" bind:this={timelineContainer}></div>
