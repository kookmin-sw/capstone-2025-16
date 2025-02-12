<script>
	import '../app.css';
	import { page } from '$app/state';
	import {data} from './data';
	import { goto } from '$app/navigation';

	let { children, data } = $props();
	
	let pathname = $state(page.url.pathname);

	let users = [12312321, 12523432, 25235235, 23523523, 325235, 32523523523532, 523523523, 523523];
</script>


<style>
	.button {
		display: inline-block;
		padding: 7px 20px;
		margin: 10px;
		font-size: 13px;
		font-weight: bold;
		color: black;
		background-color: white;
		border: 2px solid grey;
		border-color: black;
		border-radius: 8px;
		cursor: pointer;
		text-align: center;
		transition: background-color 0.3s ease;
	}
	.button-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.button:hover {
		background-color: lightgrey;
	}
</style>

<header class="fixed left-0 top-0 flex h-10 w-full border-b border-zinc-200 bg-zinc-100 z-10" >
	<p
		class="flex w-[200px] items-center justify-center border-r border-zinc-200 text-center text-lg font-bold text-zinc-800"
	>
		Bento
	</p>
	<div class="flex items-center gap-4 pl-4 text-sm">
		<a
			href="/cohort"
			class="w-fit text-center {pathname === '/cohort'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">코호트 정의</a
		>
		<a
			href="/inference"
			class="w-fit text-center {pathname === '/inference'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">모델 인퍼런스</a
		>
	</div>
</header>
<div class="fixed left-0 top-10 flex h-full w-[200px] flex-col border-r border-zinc-200">
	<div>
		<div class="button-container">
		<button class="button" onclick={() => goto('/chart')}>
			Analysis Report
		</button>
		</div>
	</div>
	<div class=" flex w-full px-2 py-2">
		<input
			type="text"
			class="h-8 w-full rounded-sm border border-zinc-200 bg-zinc-50 text-left shadow-sm placeholder:text-xs text-xs"
			placeholder="유저 ID를 입력하세요."
		/>

		<!-- <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
				<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg> -->
	</div>
	<div class="h-full w-full px-2">
		<div class="flex flex-col rounded-sm border-r border-t border-l border-zinc-200 bg-zinc-50 max-h-full overflow-y-auto">
			{#each data.userData as user}
				<a href="/{user.id}">
					<button class="w-full border-b border-zinc-200 px-2 py-2 text-left text-xs overflow-wrap">
						{user.gender} (만 {user.age}) | {user.id}
					</button>
				</a>
			{/each}
		</div>
	</div>
</div>
<div class="absolute left-[200px] top-10 h-[calc(100vh-30px)] w-[calc(100vw-200px)]">
	{@render children()}
</div>
