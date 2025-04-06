<script>
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let description = '';
	export let type = 'full';
	export let chartId;

	export let showSelector = false;
	export let options = '';
	export let selectedOption = '';
	export let hasTableView = false;
	export let isTableView = false;
	export let hasXButton = true;

	const dispatch = createEventDispatcher();

	let visible = true;
	let isDropdownOpen = false;

	function closeCard() {
		dispatch('close', { id: chartId });
		visible = false;
	}

	function handleSelect(optionId){
		dispatch('optionSelect', {chartId, optionId});
		isDropdownOpen = false;
	}

</script>

{#if visible}
<div 
	class="flex flex-col h-[300px] bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full"
	class:col-span-6={type === 'full'}
	class:col-span-3={type === 'half'}
	class:col-span-2={type === 'third'}>

	<!-- 헤더 영역 -->
	<div class="flex items-center gap-2 h-[10px]">
		<span class="text-sm font-semibold">{title}</span>
		<div class="group relative">
			<span class="text-sm text-gray-400 cursor-pointer">ⓘ</span>
			<div class="absolute bottom-full mb-2 left-0 w-48 bg-gray-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
				{description}
			</div>
		</div>

		{#if showSelector && options.length > 0}
			<div class="relative inline-block">
				<button 
					class="text-xs font-medium text-gray-700 hover:text-blue-600 flex items-center gap-2 min-w-[150px]"
					on:click|stopPropagation={() => isDropdownOpen = !isDropdownOpen}>
					<span class="truncate">{options.find(opt => opt.id === selectedOption)?.name || 'Select'}</span>
					<svg class="w-4 h-4 text-current flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				</button>
				
				{#if isDropdownOpen}
					<div 
						class="absolute z-10 left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[200px]">
						{#each options as option}
							<button
								class="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 
										{selectedOption === option.id ? 'text-blue-600 font-medium' : 'text-gray-700'}"
								on:click|stopPropagation={() => handleSelect(option.id)}>
								{option.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if hasTableView}
			<div class="flex rounded-full border border-gray-200 p-0.5 bg-gray-50 absolute top-5
				{hasXButton ? 'right-14' : 'right-6'}">
				<button 
					class="px-2 py-0.5 text-xs rounded-full transition-colors
						{!isTableView ? 
							'bg-white text-blue-600 shadow-sm' : 
							'text-gray-600 hover:text-gray-900'}"
					on:click={() => dispatch('toggleView', false)}>
					Chart
				</button>
				<button 
					class="px-2 py-0.5 text-xs rounded-full transition-colors
						{isTableView ? 
							'bg-white text-blue-600 shadow-sm' : 
							'text-gray-600 hover:text-gray-900'}"
					on:click={() => dispatch('toggleView', true)}>
					Table
				</button>
			</div>
		{/if}

		{#if hasXButton}
			<button 
				class="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer absolute right-6 top-6"
				on:click={closeCard}>
				✕
			</button>
		{/if}
	</div>

	<!-- 차트 컨텐츠 영역 -->
	<div class="flex-1 overflow-y-auto px-2">
		<div class="h-full overflow-visible">
		{#if !isTableView}
			<slot />
		{:else}
				<slot name="table" />
			{/if}
		</div>
	</div>

	</div>
{/if}

<svelte:window on:click={() => isDropdownOpen = false} />