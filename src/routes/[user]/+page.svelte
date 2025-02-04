<script>
	import { page } from '$app/stores';

	$: user = $page.params.user;

	const tables = ['Person', 'Condition', 'Drug'];
	let clickIndex = 0;

	function setIndex(index) {
		clickIndex = index;
	}
</script>

<div class="flex h-full w-full flex-col items-center border border-black">
	<div class="flex h-[30vh] w-full flex-col items-center justify-center border border-black">
		<div class="w-[90%]">2022/10/23 23:12</div>
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
<!-- ced4da -->
