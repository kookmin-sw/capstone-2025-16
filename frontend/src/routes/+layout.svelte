<script>
	import '../app.css';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { children } = $props();
	
	let pathname = $state(page.url.pathname);
	let isMenuOpen = $state(false);
	let activeMenu = $state(null);

	$effect(() => {
		pathname = page.url.pathname;
	});

	// 메뉴 상태 관리 함수
	const handleMenuEnter = (menu) => {
		isMenuOpen = true;
		activeMenu = menu;
	};

	const handleMenuLeave = () => {
		isMenuOpen = false;
		activeMenu = null;
	};
	
</script>

<div class="overflow-hidden">
	<header class="fixed left-0 top-0 w-full z-50">
		<div class="absolute inset-0 bg-white/90 backdrop-blur-sm border-b border-slate-300/80"></div>
		
		<div class="relative mx-auto max-w-[1280px] px-8">
			<div class="flex">
				<!-- 로고 영역 -->
				<a href="/" class="w-[200px] h-[60px] flex items-center justify-center gap-2">
					<svg 
						class="w-6 h-6 text-blue-600" 
						fill="none" 
						viewBox="0 0 24 24" 
						stroke="currentColor">
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<p class="text-xl font-bold">
						<span class="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
							Bento
						</span>
					</p>
				</a>

				<!-- 메인 네비게이션 -->
				<nav class="flex-1" aria-label="Main navigation">
					<div 
						role="menubar"
						tabindex="0"
						class="flex"
						onmouseenter={() => isMenuOpen = true}
						onmouseleave={() => {
							isMenuOpen = false;
							activeMenu = null;
						}}>
						<div class="flex">
							<!-- Cohorts 메뉴 -->
							<div class="w-[160px]">
								<a 
									href="/cohort" 
									role="menuitem"
									tabindex="-1"
									onmouseenter={() => activeMenu = 'cohorts'}
									class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
										{activeMenu === 'cohorts' ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'} 
										hover:text-slate-900 hover:font-semibold">
									Cohorts
								</a>
							</div>
							
							<!-- Concept Sets 메뉴 -->
							<div class="w-[200px]">
								<a 
									href="/concept-set"
									role="menuitem"
									tabindex="-1"
									onmouseenter={() => activeMenu = 'concepts'}
									class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
										{activeMenu === 'concepts' ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'} 
										hover:text-slate-900 hover:font-semibold">
									Concept Sets
								</a>
							</div>
						</div>
					</div>
				</nav>
			</div>
		</div>

		<!-- 드롭다운 패널 -->
		{#if isMenuOpen}
			<div 
				role="menu"
				tabindex="0"
				class="absolute left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-300/80 shadow-sm"
				style="top: 60px;"
				onmouseenter={() => isMenuOpen = true}
				onmouseleave={() => {
					isMenuOpen = false;
					activeMenu = null;
				}}
				transition:slide={{ duration: 250, easing: cubicOut }}>
				<div class="mx-auto max-w-[1280px] px-8">
					<div class="flex">
						<div class="w-[200px]"></div>
						
						<div class="flex">
							<!-- Cohorts 섹션 -->
							<div class="w-[160px] py-4 border-r border-slate-300">
								<ul class="space-y-3">
									<li>
										<a href="/cohort" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'cohorts'}>
											Cohort List
										</a>
									</li>
									<li>
										<a href="/new" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'cohorts'}>
											Cohort Definition
										</a>
									</li>
								</ul>
							</div>

							<!-- Concept Sets 섹션 -->
							<div class="w-[200px] py-4 border-r border-slate-300">
								<ul class="space-y-3">
									<li>
										<a href="/concept-set/list" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'concepts'}>
											Concept Set List
										</a>
									</li>
									<li>
										<a href="/concept-set/definition" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'concepts'}>
											Concept Set Definition
										</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</header>

	<main class="absolute top-[30px] w-full min-h-[calc(100vh-60px)] overflow-x-auto overflow-y-auto pt-8">
		{@render children()}
	</main>
</div>
