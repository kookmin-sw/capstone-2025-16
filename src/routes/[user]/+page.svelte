<script>
	import { page } from '$app/stores';
	import { onMount } from "svelte";

	let { data } = $props();
	const tables = ['Person', 'Condition', 'Drug'];
	let clickIndex = 0;

	function setIndex(index) {
		clickIndex = index;
	}

	let layout = "horizontal"; // 'horizontal' (좌우) 또는 'vertical' (위아래)
	let panelSize = 50; // 패널 크기 조절 (비율 %)

	function toggleLayout() {
		layout = layout === "horizontal" ? "vertical" : "horizontal";
	}

	function handleResize(event) {
		if (layout === "horizontal") {
			panelSize = Math.min(80, Math.max(20, (event.clientX / window.innerWidth) * 100));
		} else {
			panelSize = Math.min(80, Math.max(20, (event.clientY / window.innerHeight) * 100));
		}
}
</script>

<div class="flex h-full w-full flex-col items-center border border-black">
	<div class="flex h-[30vh] w-full flex-col items-center justify-center border border-black">
		<div class="w-[90%]">{data.user.date}</div>
		<div class="h-[60%] w-[90%] border border-black"></div>
	</div>
	<div class="flex h-[70vh] w-full items-center justify-center border border-black">
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
