<script>
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { children, data } = $props();
	
	let pathname = $state(page.url.pathname);

	$effect(() => {
		pathname = page.url.pathname;
	});
	
	let users = [12312321, 12523432, 25235235, 23523523, 325235, 32523523523532, 523523523, 523523];
</script>


<style>
	:global(body) {
		overflow: hidden; /* 전체 페이지의 스크롤 방지 */
	}

	.content-area {
		position: absolute;
		top: 40px;
		height: calc(100vh - 30px);
		width: 100%;
		overflow-x: auto; /* 가로 스크롤 허용 */
		overflow-y: auto; /* 세로 스크롤 허용 */
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
			class="w-fit text-center {page.url.pathname === '/cohort'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">Concept Sets</a
		>
		<a
			href="/inference"
			class="w-fit text-center {page.url.pathname === '/inference'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">Cohort Definition</a
		>
	</div>
</header>

<div class="content-area">
	{@render children()}
</div>
