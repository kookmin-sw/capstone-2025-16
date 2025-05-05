<script>
  import * as d3 from 'd3';
  import { onMount, onDestroy } from 'svelte';

  // 데이터 형식: [{ group: "그룹명", target: "타겟명", values: [5, 10, 15, ...] }, ...]
  export let data = [];
  export let colors = ["#4595EC", "#FF6B6B", "#FFD166", "#06D6A0", "#9D8DF1"];

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
    
    // 컨테이너 크기 적용 (여백 제거)
    const width = containerRect.width - 20;
    const height = containerRect.height - 20;
    
    // 여백 설정
    const margin = {top: 40, right: 30, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 기존 SVG 초기화
    svgContainer.innerHTML = '';

    // SVG 생성
    const svg = d3.create("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", "font: 10px sans-serif;");

    // 툴팁 생성 - 문서 body에 직접 추가하여 카드 밖으로 나가도 보이게 함
    const tooltip = d3.select(document.body)
      .append("div")
      .attr("class", "boxplot-tooltip fixed hidden bg-black/80 text-white px-3 py-2 rounded-md text-xs pointer-events-none whitespace-nowrap z-[9999]");

    // 차트 영역 추가
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 그룹과 타겟 정보 추출
    const groups = Array.from(new Set(data.map(d => d.group)));
    const targets = Array.from(new Set(data.map(d => d.target)));

    // 색상 스케일 (타겟 기준)
    const color = d3.scaleOrdinal()
      .domain(targets)
      .range(colors)
      .unknown("#ccc");

    // X축 스케일 - 그룹별 스케일
    const xGroupScale = d3.scaleBand()
      .domain(groups)
      .range([0, innerWidth])
      .paddingInner(0.3)
      .paddingOuter(0.2);

    // 그룹 내 타겟별 X축 스케일
    const xTargetScale = d3.scaleBand()
      .domain(targets)
      .range([0, xGroupScale.bandwidth()])
      .padding(0.2);

    // 박스 너비
    const boxWidth = Math.min(40, xTargetScale.bandwidth() * 0.9);

    // 모든 값을 하나의 배열로 합치기
    const allValues = data.flatMap(d => d.values);

    // Y 스케일 (값)
    const y = d3.scaleLinear()
      .domain([
        Math.min(...allValues) * 0.9, // 최소값보다 살짝 낮게
        Math.max(...allValues) * 1.1  // 최대값보다 살짝 높게
      ])
      .range([innerHeight, 0])
      .nice();

    // 배경 그리드
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(""))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
          .attr("stroke", "#e0e0e0")
          .attr("stroke-opacity", 0.5)
          .attr("stroke-dasharray", "2,2"));

    // X축 (그룹)
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xGroupScale))
      .call(g => g.select(".domain").attr("stroke", "#888"))
      .selectAll("text")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .attr("fill", "#444")
        .attr("dy", "0.5em");

    // Y축
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select(".domain").attr("stroke", "#888"))
      .selectAll("text")
        .style("font-size", "10px")
        .style("font-weight", "400")
        .attr("fill", "#444");

    // 각 데이터 포인트별 통계 계산
    const boxplotData = [];
    
    // 각 그룹-타겟 조합에 대한 박스플롯 데이터 계산
    groups.forEach(group => {
      targets.forEach(target => {
        // 해당 그룹과 타겟에 맞는 데이터 찾기
        const filteredData = data.filter(d => d.group === group && d.target === target);
        
        // 데이터가 없으면 건너뛰기
        if (filteredData.length === 0) return;
        
        // 모든 값 합치기
        const allValues = filteredData.flatMap(d => d.values);
        
        // 값이 없으면 건너뛰기
        if (allValues.length === 0) return;
        
        const sortedValues = [...allValues].sort(d3.ascending);
        const q1 = d3.quantile(sortedValues, 0.25);
        const median = d3.quantile(sortedValues, 0.5);
        const q3 = d3.quantile(sortedValues, 0.75);
        const iqr = q3 - q1; // 사분위범위
        const min = Math.max(d3.min(sortedValues), q1 - 1.5 * iqr); // 아래쪽 울타리 또는 최소값
        const max = Math.min(d3.max(sortedValues), q3 + 1.5 * iqr); // 위쪽 울타리 또는 최대값
        
        // 이상치 (울타리 밖의 값들)
        const outliers = sortedValues.filter(v => v < min || v > max);
        
        boxplotData.push({
          group,
          target,
          min,
          q1,
          median,
          q3,
          max,
          outliers,
          color: color(target)
        });
      });
    });

    // 범례 추가
    const legendItemSize = 10;
    const legendSpacing = 8;
    const legendTextPadding = 5;
    
    // 각 항목 너비 계산
    const legendItemWidths = targets.map(target => {
      const textWidth = target.length * 6;
      return legendItemSize + legendTextPadding + textWidth + legendSpacing;
    });
    
    // 전체 범례 너비
    const totalLegendWidth = legendItemWidths.reduce((a, b) => a + b, 0);
    
    // 범례 시작 위치 계산
    const startX = width - margin.right - totalLegendWidth;
    
    // 범례 그룹
    const legend = svg.append("g")
      .attr("transform", `translate(${startX}, ${margin.top / 2})`);
    
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
      
      // 다음 항목 위치
      legendX += legendItemWidths[i];
    });

    // 박스플롯 그리기
    boxplotData.forEach(d => {
      // 해당 그룹과 타겟에 대한 박스플롯의 위치 계산
      const xGroup = xGroupScale(d.group);
      const xTarget = xTargetScale(d.target);
      
      // 그룹 중앙에 타겟들이 모두 위치하도록 조정
      const groupWidth = xGroupScale.bandwidth();
      const allTargetsWidth = targets.length * xTargetScale.bandwidth() + 
                             (targets.length - 1) * xTargetScale.step() * xTargetScale.padding();
      const offset = (groupWidth - allTargetsWidth) / 2;
      
      const boxX = xGroup + offset + xTarget + (xTargetScale.bandwidth() - boxWidth) / 2;
      
      // 박스플롯 그룹
      const boxGroup = g.append("g")
        .attr("class", "box-group")
        .attr("transform", `translate(${boxX}, 0)`);
      
      // 수직선 (min에서 max까지)
      boxGroup.append("line")
        .attr("class", "vertical-line")
        .attr("y1", y(d.min))
        .attr("y2", y(d.max))
        .attr("x1", boxWidth / 2)
        .attr("x2", boxWidth / 2)
        .attr("stroke", d.color)
        .attr("stroke-width", 1.5);
      
      // 중앙값 라인
      boxGroup.append("line")
        .attr("class", "median-line")
        .attr("y1", y(d.median))
        .attr("y2", y(d.median))
        .attr("x1", 0)
        .attr("x2", boxWidth)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
      
      // 박스 (q1에서 q3까지)
      boxGroup.append("rect")
        .attr("class", "box hover:brightness-110 cursor-pointer transition-all duration-200")
        .attr("y", y(d.q3))
        .attr("height", y(d.q1) - y(d.q3))
        .attr("width", boxWidth)
        .attr("fill", d.color)
        .attr("fill-opacity", 0.7)
        .attr("stroke", d3.color(d.color).darker(0.5))
        .attr("stroke-width", 1)
        .attr("rx", 2) // 모서리 둥글게
        .on("mouseover", function(event) {
          // 박스 강조
          d3.select(this)
            .attr("stroke", "#333")
            .attr("stroke-width", 2)
            .attr("fill-opacity", 0.9);
          
          // 툴팁 표시
          tooltip
            .classed("hidden", false)
            .html(`
              <div class="text-center mb-1">
                <strong>${d.group}</strong> | <span style="color: ${d.color}">${d.target}</span>
              </div>
              <div>Maximum: ${d.max.toFixed(2)}</div>
              <div>Upper Quartile: ${d.q3.toFixed(2)}</div>
              <div>Median: ${d.median.toFixed(2)}</div>
              <div>Lower Quartile: ${d.q1.toFixed(2)}</div>
              <div>Minimum: ${d.min.toFixed(2)}</div>
            `);
          
          // 툴팁 위치 - 박스 위에 고정
          const boxRect = this.getBoundingClientRect();
          const tooltipRect = tooltip.node().getBoundingClientRect();
          
          tooltip
            .style("left", `${boxRect.left + boxRect.width/2 - tooltipRect.width/2}px`)
            .style("top", `${boxRect.top - tooltipRect.height - 10}px`);
        })
        .on("mouseout", function() {
          // 원래 스타일로 복원
          d3.select(this)
            .attr("stroke", d3.color(d.color).darker(0.5))
            .attr("stroke-width", 1)
            .attr("fill-opacity", 0.7);
          
          // 툴팁 숨기기
          tooltip.classed("hidden", true);
        });
      
      // 위쪽, 아래쪽 가로선 (min, max)
      ["min", "max"].forEach(type => {
        boxGroup.append("line")
          .attr("class", `${type}-line`)
          .attr("y1", y(d[type]))
          .attr("y2", y(d[type]))
          .attr("x1", boxWidth / 2 - 10)
          .attr("x2", boxWidth / 2 + 10)
          .attr("stroke", d.color)
          .attr("stroke-width", 1.5);
      });
      
      // 이상치 (outliers)
      d.outliers.forEach(value => {
        boxGroup.append("circle")
          .attr("class", "outlier hover:r-[5px] hover:stroke-2 cursor-pointer transition-all duration-200")
          .attr("cx", boxWidth / 2)
          .attr("cy", y(value))
          .attr("r", 3)
          .attr("fill", "#fff")
          .attr("stroke", d.color)
          .attr("stroke-width", 1)
          .on("mouseover", function(event) {
            d3.select(this)
              .attr("r", 5)
              .attr("stroke-width", 2);
            
            tooltip
              .classed("hidden", false)
              .html(`
                <div class="text-center mb-1">
                  <strong>${d.group}</strong> | <span style="color: ${d.color}">${d.target}</span>
                </div>
                <div>Outlier: ${value.toFixed(2)}</div>
              `);
            
            // 툴팁 위치 - 이상치 점 위에 고정
            const circleRect = this.getBoundingClientRect();
            const tooltipRect = tooltip.node().getBoundingClientRect();
            
            tooltip
              .style("left", `${circleRect.left + circleRect.width/2 - tooltipRect.width/2}px`)
              .style("top", `${circleRect.top - tooltipRect.height - 10}px`);
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("r", 3)
              .attr("stroke-width", 1);
            
            tooltip.classed("hidden", true);
          });
      });
    });

    // 차트 제거 시 툴팁도 제거
    svgContainer.addEventListener("DOMNodeRemoved", function(event) {
      if (event.target === svgContainer) {
        tooltip.remove();
      }
    });

    // SVG 추가
    svgContainer.appendChild(svg.node());
  }
</script>

<div class="w-full h-full flex items-center justify-center relative" bind:this={svgContainer}></div>

<style>
  /* 호버 효과를 위한 CSS */
  :global(.box:hover) {
    filter: brightness(1.1);
    cursor: pointer;
  }
  
  :global(.outlier:hover) {
    r: 5;
    stroke-width: 2;
    cursor: pointer;
  }
</style>
