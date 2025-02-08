<script>
	import '../app.css';
	import { page } from '$app/state';
	import { data } from './data';

	let { children } = $props();

	let pathname = $state(page.url.pathname);
</script>

<header class="fixed left-0 top-0 z-10 flex h-10 w-full border-b border-zinc-200 bg-zinc-100">
	<p
		class="flex w-[200px] items-center justify-center border-r border-zinc-200 text-center text-lg font-bold text-zinc-800"
	>
		Bento
	</p>
	<div class="flex items-center gap-4 pl-4 text-sm">
		<a
			href="/cohort"
			class="w-fit text-center {page.url.pathname === '/cohort'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">코호트 정의</a
		>
		<a
			href="/inference"
			class="w-fit text-center {page.url.pathname === '/inference'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">모델 인퍼런스</a
		>
	</div>
</header>

{#if !(pathname === '/new')}
	<div class="fixed left-0 top-10 flex h-full w-[200px] flex-col border-r border-zinc-200">
		{#if !(pathname === '/cohort')}
			<div class=" flex w-full px-2 py-2">
				<input
					type="text"
					class="h-8 w-full rounded-sm border border-zinc-200 bg-zinc-50 text-left text-xs shadow-sm placeholder:text-xs"
					placeholder="유저 ID를 입력하세요."
				/>
			</div>
			<div class="h-full w-full px-2">
				<div class="flex flex-col rounded-sm border-l border-r border-t border-zinc-200 bg-zinc-50">
					{#each data as user}
						<a href="/{user.id}">
							<button
								class="overflow-wrap w-full border-b border-zinc-200 px-2 py-2 text-left text-xs"
							>
								{user.gender} (만 {user.age}) | {user.id}
							</button>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
	<div class="absolute left-[200px] top-10 h-[calc(100vh-30px)] w-[calc(100vw-200px)]">
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
