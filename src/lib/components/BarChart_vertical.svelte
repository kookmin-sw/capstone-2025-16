<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { fade } from "svelte/transition";

  export let data = [];
  let width = 600;
  let height = 400;
  let margin = { top: 20, right: 30, bottom: 40, left: 40 };
  let hoveredBar = null;

  // X축과 Y축 설정
  let xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  let yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);
</script>

<svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
  <!-- 막대 그래프 -->
  <g fill="steelblue">
    {#each data as d, i}
      <rect
        x={xScale(d.label)}
        y={yScale(d.value)}
        width={xScale.bandwidth()}
        height={height - margin.bottom - yScale(d.value)}
        class="bar"
        role="presentation"
        rx="5" ry="5"
        on:mouseenter={() => hoveredBar = d}
        on:mouseleave={() => hoveredBar = null}
        style="animation: slideUp {300 + i * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;"
      />
      
      <!-- 호버 시 값 표시 -->
      {#if hoveredBar === d}
        <text
          x={xScale(d.label) + xScale.bandwidth() / 2}
          y={yScale(d.value) - 10}
          text-anchor="middle"
          class="value-text"
          in:fade={{ duration: 200 }}
          out:fade={{ duration: 150 }}
        >
          {d.value}
        </text>
      {/if}
    {/each}
  </g>

  <!-- X축 -->
  <g transform="translate(0,{height - margin.bottom})">
    {#each data as d}
      <text
        x={xScale(d.label) + xScale.bandwidth() / 2}
        y="20"
        text-anchor="middle"
        class="axis-label {hoveredBar === d ? 'bold' : ''}"
      >
        {d.label}
      </text>
    {/each}
  </g>

  <!-- Y축 -->
  <g transform="translate({margin.left},0)">
    {#each yScale.ticks(5) as tick}
      <text 
        x="-10" 
        y={yScale(tick)} 
        text-anchor="end" 
        alignment-baseline="middle"
        class="axis-label"
      >
        {tick}
      </text>
    {/each}
  </g>
</svg>

<style>
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bar {
    fill: #2980b9;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }

  .bar:hover {
    fill: #3498db;
    filter: brightness(1.1);
    cursor: pointer;
    transform: scale(1.005);
  }

  .value-text {
    font-size: 14px;
    font-weight: bold;
    fill: #333;
    filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1));
  }

  .axis-label {
    font-size: 12px;
    fill: #666;
    transition: all 0.3s ease;
  }

  .axis-label.bold {
    font-size: 13px;
    font-weight: 600;
    fill: #333;
  }

  .axis-label:hover {
    fill: #333;
    font-weight: 500;
  }
</style>
