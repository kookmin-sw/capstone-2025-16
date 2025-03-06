<script>
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import * as d3 from "d3";
  
    export let data = []; // 부모 컴포넌트에서 데이터 전달
    let chartContainer;
    let width;
    let height;
    export let margin = { top: 30, right: 50, bottom: 50, left: 50 };

    function handleResize(){
        if(chartContainer){
            const containerRect = chartContainer.getBoundingClientRect();
            width = containerRect.width;
            height = containerRect.height;
        }
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
            .domain(data.map(d => d.x))
            .range([margin.left, width - margin.right])
            .padding(0.1);
    
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([height - margin.bottom, margin.top]);
    
        const color = d3.scaleOrdinal(d3.schemeCategory10);
  
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
            .attr("transform", "rotate(-45)");
    
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);
  
        // 선 생성
        const line = d3
            .line()
            .x(d => x(d.x) + x.bandwidth() / 2)
            .y(d => y(d.value));
    
        const seriesData = d3.groups(data, d => d.series);
    
        seriesData.forEach(([key, values]) => {
            // 선 그리기
            svg
            .append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 2)
            .attr("d", line);
  
            // 데이터 포인트 (원) 그리기
            svg
            .selectAll(`.point-${key}`)
            .data(values)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.x) + x.bandwidth() / 2)
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("fill", color(key))
            .attr("stroke", "white")
            .on("mouseover", function (event, d) {
                tooltip
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`Cohort: ${d.series}<br>Age: ${d.x}<br>Value: ${d.value}`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
      });
  
      // 툴팁 설정
      const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("z-index", "100");
    }
  
  </script>
  
  <div bind:this={chartContainer} class="w-full h-full"></div>