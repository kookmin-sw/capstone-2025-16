<script>
  import * as d3 from "d3";
  import { onMount, onDestroy, tick } from "svelte";
  import { browser } from "$app/environment";
  import { fade } from 'svelte/transition';

  // props 정의
  export let data = [];
  export let domainKey; // 도메인 키 (condition, drug, procedure, measurement)
  export let viewType = 'combined';
  export let cohortTotalCounts = {};
  export let cohortColorMap = {};
    
  // drawChart 함수 인자
  let transformedData;
  let top10ItemNames;

	// ChartCard 내부 영역의 크기 관련 변수들
	let chartContainer;
	let width;
	let height;
  const margin = { top: 30, right: 80, bottom: 10, left: 120 };

  // 툴팁 상태 관리를 위한 변수들
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipContent = '';
  let tooltipElement;

  let orderedCohorts;

  function handleResize(){
    if(chartContainer){
        const containerRect = chartContainer.getBoundingClientRect();
        width = containerRect.width;
        height = containerRect.height;
    }
  }

	onMount(()=>{
		if(browser){
      handleResize();
			window.addEventListener('resize',handleResize)
		}
	})

	onDestroy(() => {
        if(browser){
        window.removeEventListener('resize', handleResize);
        }
    });
  
  // 데이터 변환: Top 10 아이템 추출
  $: if (data.length > 0) {
    const cohorts = [...new Set(data.map(d => d.cohort))];
    orderedCohorts = viewType === 'combined' 
      ? cohorts  // combined view에서는 원래 순서 유지
      : [
          viewType,  // anchor 코호트를 첫 번째로
          ...cohorts.filter(c => c !== viewType)  // 나머지 코호트들
        ];

    if(viewType === 'combined'){ // Combined Cohorts View인 경우 
    const totalItemCounts = d3.rollup(
      data,
      v => d3.sum(v, d => d.count), // 각 그룹의 count를 합산
      d => d[domainKey]  // domainKey를 사용하여 그룹화
    );

    // Top 10 선택
    const top10Items = Array.from(totalItemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, total]) => ({ item, total }));

    // 선택된 Top 10 이름 목록
    top10ItemNames = top10Items.map(d => d.item);
    } else { // Anchor Cohort View인 경우
      const anchorCohortData = data.filter(d => d.cohort === viewType);
      const anchorTop10 = anchorCohortData
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(d => d[domainKey]);

      top10ItemNames = anchorTop10;
    }

    // 각 코호트별로 Top 10의 count를 가져오기
    transformedData = top10ItemNames.map(itemName => {
      let itemData = { [domainKey]: itemName };  // 동적 키 사용
      
      // 모든 코호트에 대해 0으로 초기화
      orderedCohorts.forEach(cohort => {
        itemData[cohort] = 0;
      });
      
      // 실제 데이터로 업데이트
      data.forEach(d => {
        if (d[domainKey] === itemName) {
          itemData[d.cohort] = +d.count || 0;
        }
      });
      
      return itemData;
    });
  }

  $: if(chartContainer && transformedData && top10ItemNames){
    // 차트 그리기
    drawChart(transformedData, top10ItemNames);
  }

  // 차트 그리기 함수
  function drawChart(stackData, itemNames) {
    if (!chartContainer || stackData.length === 0) return;

    // 기존 SVG 초기화
    d3.select(chartContainer).selectAll("*").remove();

    // 스택 생성
    const stack = d3.stack()
      .keys(orderedCohorts)
      .value((d, key)=> +d[key] || 0)

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
      .call(g => g.selectAll(".domain").remove())

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
    .on("mouseover", function(event, d) {
      const currentCohort = d3.select(this.parentNode).datum().key;
      const value = d[1] - d[0];
      const total = cohortTotalCounts[currentCohort];
      const percentage = ((value / total) * 100).toFixed(2);

      const rect = this.getBoundingClientRect();
      const containerRect = chartContainer.getBoundingClientRect();
      const tooltipHeight = tooltipElement?.offsetHeight || 40;
      const spaceBelow = containerRect.bottom - event.clientY;

      tooltipX = rect.right - containerRect.left;
        if(spaceBelow < tooltipHeight){
            tooltipY = event.clientY - containerRect.top - tooltipHeight;
        }else{
          tooltipY = event.clientY - containerRect.top;
        }

      tooltipContent = `
        <div class="p-1">
            <div class="text-[10px] font-semibold mb-0.5">${d.data[domainKey]}</div>
            <div class="text-[9px] text-gray-600">
              ${currentCohort}:
              <span class="ml-0.5 font-medium">${value.toLocaleString()}</span>
              </br>
              <span class="text-gray-400 ml-0.5">
                (${value}/${total} ${percentage}%)
              </span>
            </div>
          </div>
      `;

      tooltipVisible = true;
      d3.select(this)
        .attr("opacity", 1)
        .style("stroke", "#666")
        .style("stroke-width", "2px");
    })
    .on("mousemove", async function(event) {
      const rect = this.getBoundingClientRect();
      const containerRect = chartContainer.getBoundingClientRect();

      const tooltipHeight = tooltipElement?.offsetHeight || 40;
      const spaceBelow = containerRect.bottom - event.clientY;

      tooltipX = rect.right - containerRect.left;

        if(spaceBelow < tooltipHeight){
            tooltipY = event.clientY - containerRect.top - tooltipHeight;
        }else{
          tooltipY = event.clientY - containerRect.top;
        }
      
    })
    .on("mouseout", function() {
      tooltipVisible = false;
      d3.select(this)
        .attr("opacity", 1)
        .style("stroke", "none")
    });
  }

</script>

<div class="relative w-full h-full">
  <div bind:this={chartContainer} class="w-full h-full"></div>

  <!-- 툴팁 -->
  {#if tooltipVisible}
    <div bind:this={tooltipElement}
    class="absolute bg-white/95 shadow-sm rounded-md border border-gray-100 z-50 pointer-events-none transition-all duration-75 backdrop-blur-sm"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    >
      {@html tooltipContent}
    </div>
  {/if}
</div>