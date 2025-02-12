<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { fade } from "svelte/transition";

  export let data = [];
  let width = 600;
  let height = 400;
  let margin = { top: 20, right: 30, bottom: 40, left: 40 };

  // X축과 Y축 설정
  let xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  let yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // 클릭된 막대 저장 (확대 효과)
  let selectedBar = null;

  function handleClick(d, event) {
    // 현재 선택한 막대를 확인하고 업데이트
    selectedBar = selectedBar === d ? null : d;
  }
</script>

<svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
  <!-- 막대 그래프 -->
  <g fill="steelblue">
    {#each data as d}
      <rect
        x={xScale(d.label)}
        y={yScale(d.value)}
        width={xScale.bandwidth()}
        height={height - margin.bottom - yScale(d.value)}
        tabindex="0" 
        role="button"
        rx="5" ry="5"
        on:click={(event) => handleClick(d, event)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            console.log(d.label + " activated via keyboard");
          }
        }}
        transition:fade={{ duration: 300 }}
      />
    {/each}
  </g>

  <!-- X축 -->
  <g transform="translate(0,{height - margin.bottom})">
    {#each data as d}
      <text
        x={xScale(d.label) + xScale.bandwidth() / 2}
        y="20"
        text-anchor="middle"
        font-size="14"
        fill="black"
      >
        {d.label}
      </text>
    {/each}
  </g>

  <!-- Y축 -->
  <g transform="translate({margin.left},0)">
    {#each yScale.ticks(5) as tick}
      <text x="-10" y={yScale(tick)} text-anchor="end" alignment-baseline="middle">
        {tick}
      </text>
    {/each}
  </g>

  <!-- 선택한 막대 위에 숫자 표시 -->
  {#if selectedBar}
    <text
      x={xScale(selectedBar.label) + xScale.bandwidth() / 2}
      y={yScale(selectedBar.value) - 10}
      text-anchor="middle"
      font-size="14"
      font-weight="bold"
      fill="red"
      transition:fade={{ duration: 200 }}
    >
      {selectedBar.value}
    </text>
  {/if}
</svg>

<style>
  rect {
    transition: transform 0.3s ease, fill 0.3s ease;
  }

  rect:hover {
    transform: scale(1.008);
    fill: orange;
  }

  
</style>
