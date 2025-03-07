<script>
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import * as d3 from "d3";
  
    export let data = []; // 부모 컴포넌트에서 데이터 전달
    let chartContainer;
    let width;
    let height;
    export let margin = { top: 30, right: 120, bottom: 50, left: 50 };  // 오른쪽 여백 증가

    // 시리즈별 가시성 상태 관리
    let visibleSeries = new Set(data.map(d => d.series));

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
            .attr("stroke", color(key))
            .attr("stroke-width", 2)
            .attr("d", line);
  
            // 데이터 포인트 (원) 그리기
            svg
            .selectAll(`.point-${key}`)
            .data(values)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.label) + x.bandwidth() / 2)
            .attr("cy", d => y(d.value))
            .attr("r", 4)
            .attr("fill", color(key))
            .attr("stroke", "white")
            .on("mouseover", function (event, d) {
                tooltip
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`Cohort: ${d.series}<br>Age: ${d.label}<br>Value: ${d.value}`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
      });
  
      // 범례 그리기
      const legend = svg.append("g")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("text-anchor", "start")
          .selectAll("g")
          .data(seriesData)
          .join("g")
          .attr("transform", (d, i) => `translate(${width - margin.right + 10},${margin.top + i * 20})`);
  
      // 범례 색상 표시
      legend.append("rect")
          .attr("x", 0)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d[0]));
  
      // 범례 텍스트
      legend.append("text")
          .attr("x", 16)
          .attr("y", 9.5)
          .attr("dy", "0.02em")
          .text(d => d[0]);
  
      // 토글 스위치 배경 (트랙)
      legend.append("rect")
          .attr("x", 60)  // 70 -> 60으로 수정
          .attr("y", 4)
          .attr("width", 20)
          .attr("height", 8)
          .attr("rx", 4)
          .attr("fill", d => visibleSeries.has(d[0]) ? "#90EE90" : "#FFB6C1")  // 연한 초록색과 연한 빨간색
          .style("cursor", "pointer")
          .on("click", (event, d) => toggleSeries(d[0]));
  
      // 토글 스위치 핸들 (동그라미)
      legend.append("circle")
          .attr("cx", d => visibleSeries.has(d[0]) ? 76 : 64)  // 86,74 -> 76,64로 수정
          .attr("cy", 8)
          .attr("r", 5)
          .attr("fill", "white")
          .attr("stroke", "#999")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .style("transition", "cx 0.2s ease")
          .on("click", (event, d) => toggleSeries(d[0]));
  
      // 범례 전체 항목의 투명도 조정
      legend.style("opacity", 1);  // 항상 완전히 보이게 수정
  
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