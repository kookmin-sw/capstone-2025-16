<script>
  import * as d3 from 'd3';
  import { onMount, onDestroy } from 'svelte';

  // 새 데이터 형식: 
  // {
  //   "chart_id": "...",
  //   "statistics_id": "...",
  //   "name": "...",
  //   "description": "...",
  //   "type": "boxplot",
  //   "definition": {
  //     "cohortIds": [...],
  //     "groups": [...]
  //   },
  //   "result": [
  //     {
  //       "cohortId": "...",
  //       "values": [
  //         [
  //           { "type": "minimum", "value": 1 },
  //           { "type": "maximum", "value": 10 },
  //           ...
  //         ],
  //         ...
  //       ]
  //     },
  //     ...
  //   ]
  // }

  export let data = {};
  export let colors = ["#4595EC", "#FF6B6B", "#FFD166", "#06D6A0", "#9D8DF1"];

  let svgContainer;
  let resizeObserver;

  function getTargetName(id) {
    return data.targetNames && data.targetNames[id] ? data.targetNames[id] : id;
  } 

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
    if (!data || !data.result || data.result.length === 0 || !svgContainer) return;

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

    // 데이터 변환 - 그룹별로 데이터 재구성
    const boxplotData = [];
    
    // 그룹 이름 가져오기
    const groupNames = data.definition.groups.map(g => g.name);
    
    // 각 코호트의 데이터 처리
    data.result.forEach(cohort => {
      cohort.values.forEach((groupValues, groupIndex) => {
        // 각 그룹별 데이터 객체 생성
        const targetId = cohort.cohortId ?? cohort.personId;
        const groupData = {
          group: groupNames[groupIndex],
          target: getTargetName(targetId),
          color: colors[data.result.findIndex(d => (d.cohortId ?? d.personId) === targetId) % colors.length],
          outliers: []
        };
        
        // 각 유형별 값 매핑
        groupValues.forEach(item => {
          if (item.type === "minimum") groupData.min = item.value;
          else if (item.type === "maximum") groupData.max = item.value;
          else if (item.type === "median") groupData.median = item.value;
          else if (item.type === "lower") groupData.q1 = item.value;
          else if (item.type === "upper") groupData.q3 = item.value;
          else if (item.type === "outlier") groupData.outliers.push(item.value);
        });
        
        boxplotData.push(groupData);
      });
    });

    // 타겟(코호트) 목록 추출
    const targets = Array.from(new Set(boxplotData.map(d => d.target)));
    
    // 그룹 목록 추출
    const groups = Array.from(new Set(boxplotData.map(d => d.group)));

    // 색상 스케일 (타겟/코호트 기준)
    const color = d3.scaleOrdinal()
      .domain(targets)
      .range(colors)
      .unknown("#ccc");

    // X축 스케일 - 그룹별 스케일
    const xGroupScale = d3.scaleBand()
      .domain(groups)
      .range([0, innerWidth])
      .paddingInner(0.6)
      .paddingOuter(0.2);

    // 그룹 내 타겟별 X축 스케일
    const xTargetScale = d3.scaleBand()
      .domain(targets)
      .range([0, xGroupScale.bandwidth()])
      .padding(0);

    // 박스 너비
    const boxWidth = Math.min(40, xTargetScale.bandwidth() * 0.9);

    // Y 스케일 계산을 위한 모든 값 수집
    const allValues = [];
    
    // 박스플롯의 모든 값(최소, 최대, 사분위값, 이상치 등) 수집
    boxplotData.forEach(d => {
      allValues.push(d.min, d.max, d.q1, d.q3, d.median);
      if (d.outliers && d.outliers.length) {
        allValues.push(...d.outliers);
      }
    });

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
        .attr("stroke", d.color)
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
      [
        { type: "min", value: d.min },
        { type: "max", value: d.max }
      ].forEach(item => {
        boxGroup.append("line")
          .attr("class", `${item.type}-line`)
          .attr("y1", y(item.value))
          .attr("y2", y(item.value))
          .attr("x1", boxWidth / 2 - 10)
          .attr("x2", boxWidth / 2 + 10)
          .attr("stroke", d.color)
          .attr("stroke-width", 1.5);
      });
      
      // 이상치 (outliers)
      if (d.outliers && d.outliers.length > 0) {
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
      }
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          Array.from(mutation.removedNodes).forEach((node) => {
            if (node === svgContainer) {
              tooltip.remove();
              observer.disconnect();
            }
          });
        }
      });
    });

    observer.observe(svgContainer.parentNode, {
      childList: true,
      subtree: false
    });

    // SVG 추가
    svgContainer.appendChild(svg.node());
  }
</script>

<div class="w-full h-full flex items-center justify-center relative" bind:this={svgContainer}></div>

<style>
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
