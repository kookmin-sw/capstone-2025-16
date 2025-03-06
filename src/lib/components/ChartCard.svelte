<script>
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let description = '';
	export let type = 'full';
	export let chartId;

	const dispatch = createEventDispatcher();

	let visible = true;

	function closeCard() {
		dispatch('close', { id: chartId });
		visible = false;
	}

</script>

{#if visible}
<div 
	class="bg-white border border-gray-300 rounded-lg shadow-md p-6 h-[350px] relative mb-7 w-full"
	class:col-span-2={type === 'full'}
	class:col-span-1={type === 'half'}>

	<!-- 헤더 영역 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-lg font-semibold">{title}</span>
			<div class="group relative">
				<span class="text-sm text-gray-400 cursor-pointer">ⓘ</span>
				<div class="absolute bottom-full mb-2 left-0 w-48 bg-gray-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
					{description}
				</div>
			</div>
		</div>
		
		<button 
			class="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer absolute right-6 top-6"
			on:click={closeCard}
		>
			✕
		</button>
	</div>

	<!-- 차트 컨텐츠 영역 -->
	<div class="h-[calc(100%-2rem)] flex flex-col">
		<slot />
	</div>
</div>
{/if}