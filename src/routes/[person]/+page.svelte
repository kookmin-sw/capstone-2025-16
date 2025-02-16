<script>
    import { onMount } from "svelte";
	import {tooltip} from '$lib/components/tootip.js';

    export let data;
    const tables = ['Person', 'Condition', 'Drug'];

    let clickIndex = 0;
    function setIndex(index) {
        clickIndex = index;
    }
</script>

<div class="flex h-full w-full flex-col items-center border border-black">
    <div class="flex h-[30vh] w-full flex-col items-center justify-center border border-black">
        <div id="top-box" class="relative w-[90%] h-[70%] flex border border-black overflow-x-scroll justify-center">
            
        </div>
    </div>

    <div class="flex h-[70vh] w-full items-center justify-center border border-black flex-col">
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
</style>
