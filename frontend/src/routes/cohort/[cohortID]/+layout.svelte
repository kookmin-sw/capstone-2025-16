<script>
    import { page } from '$app/stores';

    const cohortID = $page.params.cohortID;

    let { children, data } = $props();
</script>

<div class="fixed left-0 top-10 flex h-full w-[200px] flex-col border-r border-zinc-200">
	<div>
		<div class="button-container">
		<button class="button" onclick={() => goto('/chart')}>
			Analysis Report
		</button>
		</div>
	</div>
	<div class="flex w-full px-2 py-2">
		<input
			type="text"
			class="h-8 w-full rounded-sm border border-zinc-200 bg-zinc-50 text-left shadow-sm placeholder:text-xs text-xs"
			placeholder="유저 ID를 입력하세요."
		/>

		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
				<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg>
	</div>
	<div class="h-full w-full px-2">
		<div class="flex flex-col rounded-sm border-r border-t border-l border-zinc-200 bg-zinc-50 max-h-full overflow-y-auto">
			{#each data.userData as user}
				<a href="/cohort/{cohortID}/{user.personid}">
					<button class="w-full border-b border-zinc-200 px-2 py-2 text-left text-xs overflow-wrap">
						{user.gender} (만 {user.age}) | {user.id}
					</button>
				</a>
			{/each}
		</div>
	</div>
</div>

<div class="relative left-[200px] px-6 w-[calc(100%-206px)]">
    {@render children()}
</div>