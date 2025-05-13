<script>
    import * as d3 from "d3";
    import { onMount, onDestroy, tick } from "svelte";
    import { browser } from "$app/environment";

    export let stackData = [];
    export let itemNames = [];
    export let cohortColorMap = {};
    export let orderedCohorts = [];
    export let domainKey = '';

    let chartContainer;
    let width;
    let height;
    const margin = { top: 30, right: 80, bottom: 10, left: 140 };
    let resizeObserver;
    let tooltip;

    // 데이터나 크기가 변경될 때마다 차트 다시 그리기
    $: if (chartContainer && stackData.length > 0 && width && height) {
        drawChart();
    }

    function handleResize() {
        if (chartContainer) {
            const containerRect = chartContainer.getBoundingClientRect();
            width = containerRect.width;
            height = containerRect.height;
            drawChart();
        }
    }

    // 차트 그리기 함수
    function drawChart() {
        if (!chartContainer || !width || !height || stackData.length === 0) return;

        // 기존 SVG 초기화
        d3.select(chartContainer).selectAll("*").remove();

        // 스택 생성
        const stack = d3.stack()
            .keys(orderedCohorts)
            .value((d, key) => +d[key] || 0);

        const series = stack(stackData);

        // X 스케일 (값)
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .range([0, width - margin.left - margin.right]);

        // Y 스케일
        const yScale = d3.scaleBand()
            .domain(itemNames)
            .range([0, height - margin.bottom - margin.top])
            .padding(0.4);

        // SVG 생성
        const svg = d3.select(chartContainer)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        // X축 그리기
        svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisTop(xScale).ticks(5).tickFormat(d3.format(",.0f")))
            .call(g => g.selectAll(".domain").remove());

        // Y축 그리기
        svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScale))
            .call(g => {
                g.selectAll(".domain").remove();
                
                const maxLength = 20;
                g.selectAll("text")
                    .text(d => d.length > maxLength ? d.slice(0, maxLength - 1) + "…" : d)
            });

        // 스택 막대 그리기
        const groups = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", (d, i) => cohortColorMap[orderedCohorts[i]]);

        groups.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d.data[domainKey]))
            .attr("width", d => xScale(d[1]) - xScale(d[0]))
            .attr("height", yScale.bandwidth())
            .on("mouseover", function (event, d) {
                const currentCohort = d3.select(this.parentNode).datum().key;
                d3.select(event.target)
                    .style("stroke", "#666")
                    .style("stroke-width", "2px");
                tooltip
                    .style("display", "block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 40) + "px")
                    .html(`
                    <div class="p-1">
                        <div class="text-[10px] font-semibold mb-0.5">${d.data[domainKey]}</div>
                        <div class="text-[9px] text-gray-600">
                        ${currentCohort}:
                        <span class="ml-0.5 font-medium">${(d.data[currentCohort] || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    `);
                })
                .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 40) + "px");
                })
                .on("mouseout", (event) => {
                d3.select(event.target)
                    .style("stroke", "none");
                tooltip.style("display", "none");
                });
    }

    onMount(async () => {
        if (browser) {
            handleResize();
            await tick();
            drawChart();
            window.addEventListener('resize', handleResize);
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(chartContainer);

            tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("position", "fixed")
                .style("background", "white")
                .style("border", "1px solid #eee")
                .style("border-radius", "4px")
                .style("padding", "1px 2px")
                .style("display", "none")
                .style("pointer-events", "none")
                .style("z-index", "1000")
                .style("box-shadow", "0 2px 6px rgba(0,0,0,0.1)")
                .style("backdrop-filter", "blur(4px)")
                .style("font-size", "10px");
        }
    });

    onDestroy(() => {
        if (browser) {
            window.removeEventListener('resize', handleResize);
        }
        if (resizeObserver && chartContainer) {
            resizeObserver.unobserve(chartContainer);
        }
        if (tooltip) tooltip.remove();
    });
    
</script>

<div bind:this={chartContainer} class="w-full h-full"></div>