<script>
    import { onMount } from "svelte";
    import { tooltip } from '$lib/components/tootip.js';
	import { base } from "$app/paths";

    export let data;
    const tables = ['Person', 'Condition', 'Drug'];
    const date_state = [
        {
            id: 1,
            text: 'Daily',
        },
        {
            id : 2,
            text: 'Monthly',
        },
        {
            id : 3,
            text: 'Yearly',
        },
    ];
    const bar_colors = {
        9201: "#FF0000", // 빨강
        9202: "#FF7F00", // 주황
        9203: "#FFFF00", // 노랑
        581477: "#00FF00", // 초록
        44818517: "#0000FF", // 파랑
    };
    let scale = 1; // 확대/축소 비율 (기본값: 100%)
    let selectDate = 2;
    let dates = data?.personVisits ? generateDateRange(data.personVisits) : [];
    let show_dates = dates.length !== 0 ? filterDate() : [];
    let clickIndex = 0;

    $: dates = data?.personVisits ? generateDateRange(data.personVisits) : [];
    $: selectDate, dates, show_dates = filterDate(); // scale이 변경될 때마다 실행

    onMount(() => {
        if (data?.personVisits) {
            dates = generateDateRange(data.personVisits);
        }
    });

    function generateDateRange(data) {
        if (!data || data.length === 0) return []; // 데이터가 없을 경우 빈 배열 반환

        let minStartDate = new Date(Math.min(...data.map(d => new Date(d.visit_start_date))));
        let maxEndDate = new Date(Math.max(...data.map(d => new Date(d.visit_end_date))));
        maxEndDate.setDate(maxEndDate.getDate() + 365)
        let tmp_dates = [];
        let currentDate = new Date(minStartDate);
        
        while (currentDate <= maxEndDate) {
            tmp_dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD 형식으로 저장
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return tmp_dates;
    }

    function calculateBarPosition(visit) {
        const startIndex = show_dates.indexOf(visit.visit_start_date);
        const endIndex = show_dates.indexOf(visit.visit_end_date);
        const width = endIndex - startIndex + 1; // 막대 길이

        let baseWidth = 67 + (scale * 40); // 기본 너비
        let baseLeft = startIndex * baseWidth; // 기본 위치
        
        return {
            left: `${baseLeft}px`,
            width: `${width * baseWidth}px`
        };
    }

    function calculateBarPositionMonth(visit) {
        const startIndex = show_dates.indexOf(visit.visit_start_date.slice(0,7));
        const endIndex = show_dates.indexOf(visit.visit_end_date.slice(0,7));
        const width = endIndex - startIndex + 1; // 막대 길이
        const diffTime = new Date(visit.visit_end_date).getTime() - new Date(visit.visit_start_date).getTime();
        let diffDays = diffTime / (1000 * 60 * 60 * 24);
        if(diffDays > 30) diffDays = 30;
        else if(diffDays < 1) diffDays = 1;
        
        const startDay = parseInt(visit.visit_start_date.slice(8, 10)); // 01~31 (일)
        
        let baseWidth = 67 + (scale * 40); // 기본 너비
        let baseLeft = (startIndex * baseWidth) + ((startDay / 30) * baseWidth); // 월 내에서 비율 조정
        let barWidth = diffDays * (baseWidth / 30);

        return {
            left: `${baseLeft}px`,
            width: `${barWidth}px`
        };
    }

    function calculateBarPositionYear(visit) {
        const startIndex = show_dates.indexOf(visit.visit_start_date.slice(0,4));
        const endIndex = show_dates.indexOf(visit.visit_end_date);
        const width = endIndex - startIndex + 1; // 막대 길이
        const diffTime = new Date(visit.visit_end_date).getTime() - new Date(visit.visit_start_date).getTime();
        let diffDays = diffTime / (1000 * 60 * 60 * 24);

        const startDay = parseInt(visit.visit_start_date.slice(8, 10)); // 01~31 (일)
        const endDay = parseInt(visit.visit_end_date.slice(8, 10)); // 01~31 (일)
        const startMonth = parseInt(visit.visit_start_date.slice(5, 7)); // 01~12 (월)
        const endMonth = parseInt(visit.visit_end_date.slice(5, 7)); // 01~12 (월)
        const startYear = parseInt(visit.visit_start_date.slice(0, 4)); // YYYY (연)
        const endYear = parseInt(visit.visit_end_date.slice(0, 4)); // YYYY (연)

        let baseWidth = 67 + (scale * 40); // 기본 너비
        let baseLeft = (startIndex * baseWidth) + ((startMonth / 12) * baseWidth); // 연 내에서 비율 조정
        let barWidth = (diffDays / 30) * (baseWidth / 12);

        if(barWidth === 0) barWidth = 1;

        return {
            left: `${baseLeft}px`,
            width: `${barWidth}px`
        };
    }

    function setIndex(index) {
        clickIndex = index;
    }


    // function handleZoom(event) {
    //     scale = event.target.value / 100;
    // }

    function filterDate() {
        if (selectDate === 1) {
            // 0.7 미만이면 YYYY-MM-DD (전체 날짜)
            return dates;
        } else if (selectDate === 2) {
            // 0.7 ~ 1.2면 YYYY-MM (연, 월만 표시)
            return [...new Set(dates.map(date => date.slice(0, 7)))]; // 중복 제거
        } else {
            // 1.2 이상이면 YYYY (연도만 표시)
            return [...new Set(dates.map(date => date.slice(0, 4)))]; // 중복 제거
        }
    }

    let topBox; // 스크롤 컨테이너
    let prevScale = 1; // 이전 스케일 값 저장

    function handleZoom(event) {
        let newScale = event.target.value / 100;

        if (topBox) {
            let scrollLeftBefore = topBox.scrollLeft; // 현재 스크롤 위치 저장
            let centerPoint = scrollLeftBefore + topBox.clientWidth / 2; // 현재 중앙 위치
            
            scale = newScale; // 새로운 스케일 적용
            // 확대/축소 후 스크롤 위치 조정
            let newScrollLeft = centerPoint * (scale / prevScale) - topBox.clientWidth / 2;
            console.log(newScrollLeft);
            topBox.scrollLeft = newScrollLeft;
        }
        
        prevScale = newScale; // 이전 스케일 업데이트
    }
</script>

<div class="flex h-full w-full flex-col items-center border border-black">
    <div class="flex h-[20vh] w-full flex-col items-center justify-center border border-black">
        <div class="flex flex-row self-end mr-[5%] mb-[5px] mt-[5px] items-center">
            <div class="self-end">
                <select
                    class="text-xs pr-[25px] border-[0px] focus:outline-none focus:ring-0"
                    bind:value={selectDate}
                >
                    {#each date_state as state}
                        <option value={state.id}>
                            {state.text}
                        </option>
                    {/each}
                </select>
            </div>
            <div class="zoom-controls flex">
                <input type="range" id="zoom" min="50" max="200" step="10" value={scale * 100} on:input={handleZoom} />
                <label class="w-[50px]" for="zoom">{Math.round(scale * 100)}%</label>
            </div>
        </div>
        <div id="top-box" class="w-[90%] h-[70%] flex items-center border border-black overflow-x-scroll" bind:this={topBox}>
            <div class="bars-container">
                {#each data.personVisits as visit}
                    {#if selectDate === 1}
                        <div class="bar" style="left: {calculateBarPosition(visit).left}; width: {calculateBarPosition(visit).width}; background-color: {bar_colors[visit.visit_concept_id]};"
                            start_date="{visit.visit_start_date}"
                            end_date="{visit.visit_end_date}"
                            visit_concept_id="{visit.visit_concept_id}"
                            use:tooltip
                        ></div>
                    {:else if selectDate === 2}
                        <div class="bar" style="left: {calculateBarPositionMonth(visit).left}; width: {calculateBarPositionMonth(visit).width}; background-color: {bar_colors[visit.visit_concept_id]};" 
                            start_date="{visit.visit_start_date}"
                            end_date="{visit.visit_end_date}"
                            visit_concept_id="{visit.visit_concept_id}"
                            use:tooltip
                        ></div>
                    {:else}
                        <div class="bar" style="left: {calculateBarPositionYear(visit).left}; width: {calculateBarPositionYear(visit).width}; background-color: {bar_colors[visit.visit_concept_id]};" 
                            start_date="{visit.visit_start_date}"
                            end_date="{visit.visit_end_date}"
                            visit_concept_id="{visit.visit_concept_id}"
                            use:tooltip
                        ></div>
                    {/if}
                {/each}
            </div>
            <div class="flex self-end" style="gap: {40 * scale}px;">
                {#each show_dates as date}
                    <p class="text-xs w-[67px] m-0 leading-none whitespace-nowrap">
                        |<br/>
                        {date}
                    </p>
                {/each}
            </div>
        </div>
    </div>

    <div class="flex h-[80vh] w-full items-center justify-center border border-black flex-col">
        <!-- <div class="w-[90%]">{data.user.name} / {data.user.date} / {data.user.gender} / {data.user.age}</div> -->
        <div class="h-[90%] w-[90%] border border-black">
            <ul class="flex border-b border-black">
                {#each tables as table, index}
                    <li>
                        <button
                            class="h-[30px] w-[100px] border border-black text-center"
                            class:bg-zinc-300={clickIndex === index}
                            class:bg-white={clickIndex !== index}
                            class:font-semibold={clickIndex === index}
                            class:font-normal={clickIndex !== index}
                            on:click={() => setIndex(index)}>{table}</button
                        >
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>

<style>
    #top-box::-webkit-scrollbar {
        display: none; /* 크롬, 사파리 */
    }

    #top-box {
        -ms-overflow-style: none; /* IE, Edge */
        scrollbar-width: none; /* 파이어폭스 */
    }
    .bars-container {
        position: relative;
    }

    .bar {
        position: absolute;
        height: 20px;
        background-color: lightblue;
        text-align: center;
        line-height: 20px;
        border-radius: 5px;
        font-size: 12px;
        transform: translate(0, -50%);
    }
</style>
