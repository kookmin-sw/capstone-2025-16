<script>
    import { onMount, onDestroy, tick } from "svelte";
    import { browser } from "$app/environment";
    import * as d3 from "d3";

    export let data = [];
    export let cohortColorMap = {};
    export let showLegend = true;

    const margin = { top: 30, right: 120, bottom: 50, left: 50 };
    if(!showLegend) margin.right = 30;
    let chartContainer;
    let width;
    let height;
    let resizeObserver;
    let visibleSeries;
    let tooltip;

    // cohortColorMap이 변경될 때마다 visibleSeries 업데이트
    $: {
        visibleSeries = new Set(Object.keys(cohortColorMap));
    }

    $: total = data?.reduce((sum, d) => sum + (d?.value || 0), 0) || 0;

    function handleResize() {
        if (chartContainer) {
            const containerRect = chartContainer.getBoundingClientRect();
            width = containerRect.width;
            height = containerRect.height;
            drawChart();
        }
    }

    async function initializeChart() {
        if (browser && chartContainer) {
            // 툴팁 초기화
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid #eee")
                .style("border-radius", "4px")
                .style("padding", "0")
                .style("display", "none")
                .style("pointer-events", "none")
                .style("z-index", "100")
                .style("box-shadow", "0 2px 4px rgba(0,0,0,0.05)")
                .style("backdrop-filter", "blur-sm");

            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === chartContainer) {
                        handleResize();
                    }
                }
            });
            resizeObserver.observe(chartContainer);
            await tick();
            handleResize();
        }
    }

    // 시리즈 토글 함수
    function toggleSeries(series) {
        if (visibleSeries.has(series)) {
            visibleSeries.delete(series);
        } else {
            visibleSeries.add(series);
        }
        visibleSeries = visibleSeries; // Svelte 반응성 트리거
        drawChart();
    }

    function drawChart() {
        if (!chartContainer || !width || !height || !data || data.length === 0 || total === 0) return;

        const svg = d3
            .select(chartContainer)
            .html("") // 기존 SVG 초기화
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // 스케일 설정
        const x = d3
            .scaleBand()
            .domain(data.map(d => d.label))
            .range([margin.left, width - margin.right])
            .padding(0.1);
    
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([height - margin.bottom, margin.top]);
      
        // X축 & Y축
        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y);
    
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .attr("stroke", d => cohortColorMap[d]); 
    
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);
  
        // 선 생성
        const line = d3
            .line()
            .x(d => x(d.label) + x.bandwidth() / 2)
            .y(d => y(d.value));
    
        const seriesData = d3.groups(data, d => d.series);

        // 선 그리기
        seriesData.forEach(([series, values]) => {
            const isVisible = visibleSeries.has(series);
            const opacity = isVisible ? 1 : 0.2;

            // 선 그리기
            svg.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", cohortColorMap[series])
                .attr("stroke-width", 2)
                .attr("d", line)
                .attr("class", `line-${series}`)
                .style("opacity", opacity);
            
            // 점 그리기
            svg.selectAll(`circle-${series}`)
                .data(values)
                .join("circle")
                .attr("cx", d => x(d.label) + x.bandwidth() / 2)
                .attr("cy", d => y(d.value))
                .attr("r", 4)
                .attr("fill", cohortColorMap[series])
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("class", `point-${series}`)
                .style("opacity", opacity)
                .style("pointer-events", isVisible ? "auto" : "none")
                .on("mouseover", function(event, d) {
                    if (!visibleSeries.has(series)) return;
                    
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 6);

                    tooltip
                        .style("display", "block")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .html(`
                            <div class="p-1">
                                <div class="text-[10px] font-semibold mb-0.5">${series}</div>
                                <div class="text-[9px] text-gray-600">
                                    ${d.label}:
                                    <span class="ml-0.5 font-medium text-black">${d.value.toLocaleString()}</span>
                                </div>
                            </div>
                        `);
                })
                .on("mouseout", function() {
                    if (!visibleSeries.has(series)) return;
                    
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 4);
                    
                    tooltip.style("display", "none");
                });
        });

        // 범례 그리기
        if (showLegend) {
            const legend = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "start")
                .selectAll("g")
                .data(seriesData)
                .join("g")
                .attr("transform", (d, i) => `translate(${width - margin.right + 10},${margin.top + i * 20})`);

            // 범례 색상 표시 및 체크박스
            legend.append("rect")
                .attr("x", 0)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", d => cohortColorMap[d[0]])
                .attr("stroke", d => cohortColorMap[d[0]])
                .attr("cursor", "pointer")
                .style("opacity", d => visibleSeries.has(d[0]) ? 1 : 0.2)
                .on("click", (event, d) => toggleSeries(d[0]));

            // 체크마크
            legend.append("path")
                .attr("d", "M2 6l3 3 5-5")
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)
                .attr("fill", "none")
                .style("opacity", d => visibleSeries.has(d[0]) ? 1 : 0);

            // 범례 텍스트
            legend.append("text")
                .attr("x", 20)
                .attr("y", 9.5)
                .attr("dy", "0.02em")
                .text(d => {
                    const maxLength = 18;
                    return d[0].length > maxLength ? d[0].slice(0, maxLength - 1) + "…" : d[0];
                })
                .append("title") // hover 시 전체 이름 표시
                .text(d => d[0])
                .style("opacity", d => visibleSeries.has(d[0]) ? 1 : 0.5)
                .style("cursor", "pointer")
                .on("click", (event, d) => toggleSeries(d[0]));
        }
    }

    onMount(() => {
        initializeChart();
    });

    onDestroy(() => {
        if (browser && resizeObserver) {
            resizeObserver.disconnect();
        }
        // 툴팁 제거
        if (tooltip) {
            tooltip.remove();
        }
    });

    $: if (data && data.length > 0 && width && height) {
        drawChart();
    }
</script>

<div class="relative w-full h-full">
    {#if !data || data.length === 0 || total === 0}
        <div class="absolute inset-0 flex items-center justify-center">
        <p class="text-xs text-gray-500 text-center">Currently, no data is available for display.</p>
        </div>
    {/if}

    <div bind:this={chartContainer} class="w-full h-full [&>svg]:max-w-full [&>svg]:h-auto"></div>
</div>  