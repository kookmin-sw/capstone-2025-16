<script>
    import * as d3 from "d3";
  
    export let data = [];
  
    const formatLabel = d3.format(',.0f');
  
    const margin = { top: 30, right: 100, bottom: 0, left: 110 };
    let width = 400;
    let height = 320;
  
    $: innerWidth = width - margin.left - margin.right;
    let innerHeight = height - margin.top - margin.bottom;
  
    $: xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([0, innerWidth]);
  
    const yScale = d3
      .scaleBand()
      .domain(data.map(d => d.label))
      .range([innerHeight, 0])
      .padding(0.25);
  </script>
  
  <div class="wrapper" bind:clientWidth={width}>
    <svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
        {#each data as d}
          <text
            text-anchor="end"
            x={-10}
            y={yScale(d.label) + yScale.bandwidth() / 2}
            dy=".35em"
          >
            {d.label}
          </text>
          <rect
            x={0}
            y={yScale(d.label)}
            width={xScale(d.value)}
            height={yScale.bandwidth()}
          />
          <text
            text-anchor="start"
            x={xScale(d.value)}
            dx="10"
            y={yScale(d.label) + yScale.bandwidth() / 2}
            dy=".35em"
          >
            {formatLabel(d.value)}
          </text>
        {/each}
      </g>
    </svg>
  </div>
  
  <style>
    .wrapper {
      position: relative;
      width: 100%;
      max-width: 700px;
    }
  
    rect {
      fill: #4427ca;
    }
  </style>