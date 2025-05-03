<script>
    import * as d3 from 'd3';
    import { onMount, onDestroy } from 'svelte';
  
    export let data = [];
  
    let svgContainer;
    let resizeObserver;
  
    onMount(() => {
      drawChart();
      
      // 컨테이너 크기 변경 감지
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(drawChart);
        resizeObserver.observe(svgContainer);
      } else {
        window.addEventListener('resize', drawChart);
      }
    });
    
    onDestroy(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', drawChart);
      }
    });
  
    function drawChart() {
      if (!data || data.length === 0 || !svgContainer) return;
  
      // 컨테이너 크기에 맞게 조정
      const containerRect = svgContainer.getBoundingClientRect();
      
      // 컨테이너 크기 적용 (10px 여백 제거)
      const width = containerRect.width - 10;
      const height = containerRect.height - 10;
      
      // 데이터 크기에 따라 동적으로 여백 조정
      const dataCount = new Set(data.map(d => d.group)).size;
      const marginLeft = Math.min(Math.max(50, 10 + dataCount * 3), 40); // 데이터 수에 따라 25~40px 사이로 조정
      const marginBottom = Math.min(30, Math.max(20, dataCount * 2)); // 20~30px 사이로 조정
      
      const marginTop = 10;
      const marginRight = 10;
      const minGroupGap = 20;  // 최소 그룹 간 여백
      const groupWidth = 50;   // 그룹당 기본 폭 (코호트 수와 막대폭 기준)
      const totalRequiredWidth = dataCount * (groupWidth + minGroupGap);
      const finalWidth = Math.max(width, totalRequiredWidth);
      const barWidth = 17;

  
      svgContainer.innerHTML = '';
  
      // x축 스케일 - 데이터 수에 따라 padding 동적 조정
      const fx = d3.scaleBand()
        .domain(new Set(data.map(d => d.group)))
        .rangeRound([marginLeft, width - marginRight])
        .paddingInner(Math.min(0.2, 0.2 + (1 / dataCount))) // 데이터가 많을수록 패딩을 줄임
        .paddingOuter(0.05);
  
      const targets = Array.from(new Set(data.map(d => d.target)));
  
      const x = d3.scaleBand()
        .domain(targets)
        .rangeRound([0, fx.bandwidth()])
        .padding(Math.min(5, 5 + (1 / targets.length))); // 데이터가 많을수록 패딩을 줄임
  
      // 색상 팔레트
      const customColors = ["#4595EC", "#FF6B6B", "#FFD166", "#06D6A0", "#9D8DF1"];
  
      const color = d3.scaleOrdinal()
        .domain(targets)
        .range(customColors)
        .unknown("#ccc");
  
      // y축 스케일
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.05]).nice()
        .range([height - marginBottom, marginTop]);
  
      // SVG 생성 - viewBox를 사용하여 자동 스케일링
      const svg = d3.create("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("style", "font: 10px sans-serif;");
  
      // 툴팁 생성
      const tooltip = d3.select(svgContainer)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "10")
        .style("white-space", "nowrap");

      // 배경 그리드
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y)
            .tickSize(-(width - marginRight - marginLeft))
            .tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "2,2"));
  
      // 막대 그래프 그리기
      svg.append("g")
        .selectAll("g")
        .data(d3.group(data, d => d.group))
        .join("g")
          .attr("transform", ([group]) => `translate(${fx(group)},0)`)
        .selectAll("rect")
        .data(([, d]) => d)
        .join("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.target) + (x.bandwidth() - barWidth) / 2)
          .attr("y", d => y(d.value))
          .attr("width", barWidth)
          .attr("height", d => y(0) - y(d.value))
          .attr("fill", d => color(d.target))
          .attr("rx", 1.5)
          .attr("ry", 1.5)
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .style("transition", "all 0.2s ease")
          .on("mouseover", function(event, d) {
            // 막대 강조 효과
            d3.select(this)
              .attr("stroke", "#333")
              .attr("stroke-width", 1.5)
              .attr("fill-opacity", 0.9)
              .attr("fill", d => d3.color(color(d.target)).brighter(0.2));
            
            // 툴팁 표시
            tooltip
              .style("visibility", "visible")
              .html(`
                <div>
                  <strong>${d.group}</strong> | <span style="color: ${color(d.target)}">${d.target}</span>
                </div>
                <div>${d3.format(",.0f")(d.value)}</div>
              `);
            
            // 툴팁 위치 조정
            const tooltipWidth = tooltip.node().getBoundingClientRect().width;
            const tooltipHeight = tooltip.node().getBoundingClientRect().height;
            const svgRect = svgContainer.getBoundingClientRect();
            const barRect = this.getBoundingClientRect();
            
            let xPos = barRect.left - svgRect.left + barRect.width / 2 - tooltipWidth / 2;
            let yPos = barRect.top - svgRect.top - tooltipHeight - 10;
            
            // 툴팁이 차트 영역을 벗어나지 않도록 조정
            if (xPos < 0) xPos = 0;
            if (xPos + tooltipWidth > svgRect.width) xPos = svgRect.width - tooltipWidth;
            if (yPos < 0) yPos = barRect.top - svgRect.top - 10;
            
            tooltip
              .style("left", `${xPos}px`)
              .style("top", `${yPos}px`);
          })
          .on("mouseout", function(event, d) {
            // 원래 스타일로 복원
            d3.select(this)
              .attr("stroke", "white")
              .attr("stroke-width", 0.5)
              .attr("fill-opacity", 1)
              .attr("fill", d => color(d.target));
            
            // 툴팁 숨기기
            tooltip.style("visibility", "hidden");
          });
  
      // X축 - 데이터가 많으면 글꼴 크기 줄이고 회전
      const xAxisG = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(fx))
        .call(g => g.select(".domain").attr("stroke", "#888").attr("stroke-width", 0.8))
        .call(g => g.selectAll(".tick line").attr("stroke", "#888").attr("stroke-width", 0.8));
        
      // 데이터 개수에 따라 텍스트 스타일 조정
      xAxisG.selectAll("text")
        .style("font-size", `${Math.max(11, 9 - dataCount * 0.5)}px`) // 데이터가 많을수록 작게
        .style("font-weight", "500")
        .attr("dx", "-0.5em")
        .attr("dy", "0.5em")
        .attr("fill", "#444");
  
      // Y축
      svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(".2s")(d)))
        .call(g => g.select(".domain").attr("stroke", "#888").attr("stroke-width", 0.8))
        .call(g => g.selectAll(".tick line").attr("stroke", "#888").attr("stroke-width", 0.8))
        .selectAll("text")
        .style("font-size", "10px")
        .style("font-weight", "400")
        .attr("fill", "#444");
      
      // 범례 스타일
      const legendItemSize = 10;    // 사각형 크기
      const legendSpacing = 8;      // 항목 간 가로 간격
      const legendTextPadding = 5;  // 사각형-텍스트 간격

      // 각 항목 너비 계산
      const legendItemWidths = targets.map(target => {
        const textWidth = target.length * 6;
        return legendItemSize + legendTextPadding + textWidth + legendSpacing;
      });

      // 전체 범례 블록 너비
      const totalLegendWidth = legendItemWidths.reduce((a, b) => a + b, 0);

      // 우측 끝에서 시작할 x 좌표 계산
      const startX = width - marginRight - totalLegendWidth;

      // 범례 그룹
      const legend = svg.append("g")
        .attr("transform", `translate(${startX}, ${marginTop})`);  // 우측 상단 끝 기준

      let legendX = 0;
      targets.forEach((target, i) => {
        const legendGroup = legend.append("g")
          .attr("transform", `translate(${legendX}, 0)`);

        // 색상 박스
        legendGroup.append("rect")
          .attr("width", legendItemSize)
          .attr("height", legendItemSize)
          .attr("fill", color(target))
          .attr("rx", 2)
          .attr("ry", 2);

        // 텍스트
        legendGroup.append("text")
          .attr("x", legendItemSize + legendTextPadding)
          .attr("y", legendItemSize / 2)
          .attr("dy", "0.35em")
          .text(target)
          .style("font-size", "10px")
          .attr("fill", "#444");

        // 다음 항목 위치로 이동
        legendX += legendItemWidths[i];
      });


      svgContainer.appendChild(svg.node());
    }
  </script>
  
  <div class="w-full h-full flex items-center justify-center mx-5 relative" bind:this={svgContainer}></div>
  
  <style>
    :global(.bar:hover) {
      filter: brightness(1.1);
      cursor: pointer;
    }
  </style>
  