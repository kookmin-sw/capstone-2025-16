<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { fade } from 'svelte/transition';
  
    export let data = [];
  
    const formatLabel = d3.format(',.0f');

    let margin = { top: 30, right: 50, bottom: 0, left: 50 };
    let width = 400;
    let height = 320;
    let chartContainer;
    let innerWidth;
    let innerHeight;
    let hoveredLabel = null; // 현재 호버된 막대의 레이블 추적
    
    $: innerWidth = width - margin.left - margin.right;
    $: innerHeight = height - margin.top - margin.bottom;
    
    $: xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([0, innerWidth]);

    $: yScale = d3
      .scaleBand()
      .domain(data.map(d => d.label))
      .range([innerHeight, 0])
      .padding(0.25);
    
    onMount(() => {
        const tempSvg = d3.select(chartContainer)
            .append("svg")
            .style("visibility", "hidden");

        // 가장 긴 레이블의 길이 계산 (두 줄 텍스트 고려)
        const maxLabelWidth = d3.max(data, d => {
            const lines = wrapLabel(d.label);
            return d3.max(lines, line => {
                const text = tempSvg
                    .append("text")
                    .style("font-size", "10px")
                    .text(line);
                const width = text.node().getBBox().width;
                text.remove();
                return width;
            });
        });

        // 값 레이블의 최대 길이 계산
        const maxValueWidth = d3.max(data, d => {
            const text = tempSvg
                .append("text")
                .style("font-size", "10px")
                .text(formatLabel(d.value));
            const width = text.node().getBBox().width;
            text.remove();
            return width;
        });

        tempSvg.remove();

        // 왼쪽 마진: 레이블 길이 + 여유 공간
        margin.left = maxLabelWidth + 40;
        // 오른쪽 마진: 값 레이블 길이 + 여유 공간
        margin.right = maxValueWidth + 40;
        
        // 실제 차트가 그려질 영역 계산
        const availableWidth = chartContainer.clientWidth;
        width = availableWidth; // 컨테이너의 전체 너비로 설정
    });

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

<div class="wrapper" bind:clientWidth={width} bind:this={chartContainer}>
    <svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
            {#each data as d}
                {@const lines = wrapLabel(d.label)}
                <text
                    text-anchor="end"
                    x={-10}
                    y={yScale(d.label) + yScale.bandwidth() / 2}
                    style="font-size:10px"
                    class="label-text {hoveredLabel === d.label ? 'bold' : ''}"
                >
                    {#each lines as line, i}
                        <!-- 두 줄일 경우 첫번째 줄은 약간 위로 올려 전체가 수직 중앙에 오도록 함 -->
                        <tspan x={-10} dy={i === 0 ? (lines.length === 2 ? "-0.6em" : ".35em") : "1.2em"}>
                            {line}
                        </tspan>
                    {/each}
                </text>
                <rect
                    in:fade={{ duration: 500, delay: 100 * data.indexOf(d) }}
                    x={0}
                    y={yScale(d.label)}
                    width={xScale(d.value)}
                    height={yScale.bandwidth()}
                    class="bar"
                    role="button"
                    tabindex="0"
                    on:mouseenter={() => hoveredLabel = d.label}
                    on:mouseleave={() => hoveredLabel = null}
                />
                <text
                    text-anchor="start"
                    x={xScale(d.value)}
                    dx="10"
                    y={yScale(d.label) + yScale.bandwidth() / 2}
                    dy=".35em"
                    style="font-size:10px"
                    class="value-text {hoveredLabel === d.label ? 'bold' : ''}"
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
        display: flex;
        justify-content: center;
        align-items: center;
    }

    rect.bar {
        fill: #4427ca;
        transition: all 0.3s ease;
        outline: none;
    }

    rect.bar:hover {
        fill: #6547e8;
        filter: brightness(1.1);
        cursor: pointer;
    }

    rect.bar:focus {
        outline: none;
    }

    .label-text, .value-text {
        transition: all 0.2s ease;
    }

    .bold {
        font-weight: 600;
        font-size: 11px !important;
    }
</style>
