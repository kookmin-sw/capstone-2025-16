<script>
    import * as d3 from "d3";
  
    export let data = [];
  
    const formatLabel = d3.format(',.0f');

    // label이 긴 경우를 대비하여 왼쪽 여백을 충분히 확보
    const margin = { top: 30, right: 100, bottom: 0, left: 250 };
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

    // 텍스트를 두 줄로 나눌 함수 (15자 이상이면 중간에서 잘라 두 줄로)
    function wrapLabel(text) {
      const threshold = 15;
      if (text.length > threshold) {
        // 가능한 한 단어 단위로 분리 (중간에 공백이 있으면 그 위치에서 분리)
        const mid = Math.floor(text.length / 2);
        const index = text.lastIndexOf(" ", mid);
        if (index > 0) {
          return [text.slice(0, index), text.slice(index + 1)];
        } else {
          return [text.slice(0, mid), text.slice(mid)];
        }
      } else {
        return [text];
      }
    }
  </script>

<div class="wrapper" bind:clientWidth={width}>
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {#each data as d}
        {@const lines = wrapLabel(d.label)}
        <text
          text-anchor="end"
          x={-10}
          y={yScale(d.label) + yScale.bandwidth() / 2}
          style="font-size:10px"
        >
          {#each lines as line, i}
            <!-- 두 줄일 경우 첫번째 줄은 약간 위로 올려 전체가 수직 중앙에 오도록 함 -->
            <tspan x={-10} dy={i === 0 ? (lines.length === 2 ? "-0.6em" : ".35em") : "1.2em"}>
              {line}
            </tspan>
          {/each}
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
          style="font-size:10px"
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
    max-width: 100%;
    padding-bottom: 30px;
  }

  rect {
    fill: #4427ca;
  }
</style>
