<script>
    import { onMount } from "svelte";

    export let data;
    const tables = ['Person', 'Condition', 'Drug'];
    const domains = ["conditions", "conditioneras", "devices", "drugs", "measurements", "observations", "procedures", "visits"];

    // ✅ 보기 모드 상태 (연도별 / 월별)
    let viewMode = "year"; // 기본값: 연도별 보기 (year)

    // ✅ X축 날짜 데이터
    let dates = [];
	let minDate, maxDate; // 가장 빠른/느린 날짜
    let startDate, endDate;

	function extractDateRange() {
        if (!data.userCdms || data.userCdms.length === 0) return;

        let dateList = data.userCdms.map(user => new Date(user.date));
        minDate = new Date(Math.min(...dateList));
        maxDate = new Date(Math.max(...dateList));

        startDate = new Date(minDate.getFullYear(), 0, 1); // 연도별 보기에서는 1월 1일
        endDate = new Date(maxDate.getFullYear(), 11, 31); // 연도별 마지막일

        generateDates(data.userCdms);
    }

    function generateDates(userCdms) {
        dates = [];
        let tempDate = new Date(startDate);
        if (viewMode === "year") {
			tempDate.setFullYear(tempDate.getFullYear()-1);
            while (tempDate.getFullYear() <= endDate.getFullYear()) {
                dates.push(tempDate.getFullYear().toString()); // YYYY 형식
                tempDate.setFullYear(tempDate.getFullYear() + 1);
            }
        } else {
            while (tempDate <= endDate) {
                dates.push(tempDate.toISOString().slice(0, 7)); // YYYY-MM 형식
                tempDate.setMonth(tempDate.getMonth() + 1);
            }
        }
    }

    // ✅ 토글 버튼 클릭 시 날짜 데이터 변경
    function toggleView() {
        viewMode = viewMode === "year" ? "month" : "year";
        generateDates(); // 날짜 다시 생성
    }

    function getMonthProgress(date) {
        let dt = new Date(date);
        let startOfMonth = new Date(dt.getFullYear(), dt.getMonth(), 1);
        let endOfMonth = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
        return (dt - startOfMonth) / (endOfMonth - startOfMonth);
    }

	function getYearProgress(date) {
        let dt = new Date(date);
        let startOfYear = new Date(dt.getFullYear(), 0, 1);
        let endOfYear = new Date(dt.getFullYear() + 1, 0, 1);
        return (dt - startOfYear) / (endOfYear - startOfYear);
    }

	$: data, extractDateRange();

    onMount(extractDateRange);

    let clickIndex = 0;
    function setIndex(index) {
        clickIndex = index;
    }
</script>

<div class="flex h-full w-full flex-col items-center border border-black">
    <div class="flex h-[30vh] w-full flex-col items-center justify-center border border-black">
		<!-- ✅ 연도별/월별 토글 버튼 -->
		<div class="flex justify-end w-[90%] py-2">
			<button class="px-4 py-2 border border-black text-black rounded-md" on:click={toggleView}>
				{viewMode === "year" ? "월별 보기" : "연도별 보기"}
			</button>
		</div>
        <div id="top-box" class="relative w-[90%] h-[70%] flex border border-black overflow-x-scroll justify-center">
            <!-- ✅ X축 날짜 라벨 (연도별 / 월별 토글 적용) -->
            <div class="flex gap-2 self-end">
                {#each dates as date, i}
                    <div class="date-container">
                        <!-- ✅ 연도별 및 월별 점(●) 표시 -->
                        {#each data.userCdms as user}
							{#if viewMode === "year" && user.date.startsWith(date)}
							<div class="dot" 
								style="left: calc(50% + {getYearProgress(user.date) * 50}px); top: -20px;">
							</div>
							{/if}

                            {#if viewMode === "month" && user.date.startsWith(date.slice(0, 7))}
                                <div class="dot" 
                                    style="left: calc(50% + {getMonthProgress(user.date) * 50}px); top: -20px;">
                                </div>
                            {/if}
                        {/each}

                        <!-- ✅ 날짜 텍스트 (간격 조정) -->
                        {#if (viewMode === "year") || (viewMode === "month")}
                            <p class="text-center text-xs m-0 leading-none">
                                |<br/>
                                {date.replace("-", ".")}
                            </p>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class="flex h-[70vh] w-full items-center justify-center border border-black flex-col">
        <div class="w-[90%]">{data.user.name} / {data.user.date} / {data.user.gender} / {data.user.age}</div>
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
    .dot {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: red;
		top: 50%;
		left: 50%;
        transform: translate(-50%, -50%);
    }
    .date-container {
        position: relative;
        min-width: 20px; /* 날짜 간격을 일 단위로 세분화 */
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
