<script>
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import * as d3 from "d3";
  
    export let data = [];
    export let cohortColorMap;
    let margin = { top: 30, right: 120, bottom: 50, left: 50 };  // 오른쪽 여백 증가
    let chartContainer;
    let width;
    let height;

    $: uniqueSeries = [...new Set(data.map(d => d.series))];
    $: visibleSeries = new Set(uniqueSeries);
    $: showLegend = uniqueSeries.length > 1;
    $: effectiveMargin = { ...margin };
    $: if (!showLegend) {
        effectiveMargin.right = 30;
    }


    function handleResize(){
        if(chartContainer){
            const containerRect = chartContainer.getBoundingClientRect();
            width = containerRect.width;
            height = containerRect.height;
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
        updateChart(); // 차트 업데이트 함수 호출
    }

    // 차트 업데이트 함수
    function updateChart() {
        if (!chartContainer || !data || data.length === 0) return;

        const svg = d3.select(chartContainer).select("svg");
        
        // 기존 차트 요소들 업데이트
        seriesData.forEach(([key, values]) => {
            // 선 업데이트
            svg.select(`path.line-${key}`)
                .style("opacity", visibleSeries.has(key) ? 1 : 0);

            // 점 업데이트
            svg.selectAll(`.point-${key}`)
                .style("opacity", visibleSeries.has(key) ? 1 : 0);
        });
    }

    onMount(() => {
        if(browser){
            window.addEventListener('resize', handleResize);
        }
    });

    onDestroy(() => {
        if(browser){
            window.removeEventListener('resize', handleResize);
        }
    });

    $: if(chartContainer && data && data.length > 0) {
        handleResize();

        const svg = d3
            .select(chartContainer)
            .html("") // 기존 SVG 초기화
            .append("svg")
            .attr("width", width)
            .attr("height", height);

            // 스케일 설정
        const x = d3
            .scaleBand()
            .domain(data.map(d => d.label))
            .range([effectiveMargin.left, width - effectiveMargin.right])
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
            .attr("transform", `translate(0,${height - effectiveMargin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .attr("stroke", d => cohortColorMap[d]); 
    
        svg.append("g")
            .attr("transform", `translate(${effectiveMargin.left},0)`)
            .call(yAxis);
  
        // 선 생성
        const line = d3
            .line()
            .x(d => x(d.label) + x.bandwidth() / 2)
            .y(d => y(d.value));
    
        const seriesData = d3.groups(data, d => d.series);
    
        seriesData.forEach(([key, values]) => {
            if (!visibleSeries.has(key)) return; // 숨겨진 시리즈는 건너뛰기

            // 선 그리기
            svg
            .append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", cohortColorMap[key])
            .attr("d", line(values))
            .attr("class", `line-${key}`)
            .attr("opacity", visibleSeries.has(key) ? 1 : 0);
  
            // 데이터 포인트 (원) 그리기
            svg
            .selectAll(`.point-${key}`)
            .data(values)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.label) + x.bandwidth() / 2)
            .attr("cy", d => y(d.value))
            .attr("r", 4)
            .attr("fill", cohortColorMap[key])
            .attr("stroke", "white")
            .attr("opacity", visibleSeries.has(key) ? 1 : 0)
            .on("mouseover", function (event, d) {
                tooltip
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`
                    <div class="p-1">
                    <div class="text-[10px] font-semibold mb-0.5">${d.series}</div>
                    <div class="text-[9px] text-gray-600">
                        ${d.label}:
                        <span class="ml-0.5 font-medium text-black">${d.value.toLocaleString()}</span>
                    </div>
                    </div>
                `);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
      });
  
      // 범례 그리기
    if(showLegend){
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
            .text(d => d[0])
            .style("opacity", d => visibleSeries.has(d[0]) ? 1 : 0.5)
            .style("cursor", "pointer")
            .on("click", (event, d) => toggleSeries(d[0])); // 텍스트 클릭으로도 토글 가능하게
      }
      
    // 툴팁 설정
    const tooltip = d3
        .select("body")
        .append("div")
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
    }
  
</script>

<div bind:this={chartContainer} class="w-full h-full"></div>