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
					<!-- <svg 
						class="w-6 h-6 text-blue-600" 
						viewBox="180 150 250 250"
						fill="none">
						<path 
							fill="#155dfc"
							d="M271.06,193.11h-10.87c-1.39,0-2.51,1.12-2.51,2.51v14.6h-14.6c-1.39,0-2.51,1.12-2.51,2.51v10.87c0,1.39,1.12,2.51,2.51,2.51h14.6v13.38c0,1.39,1.12,2.51,2.51,2.51h10.87c1.39,0,2.51-1.12,2.51-2.51v-13.38h14.6c1.39,0,2.51-1.12,2.51-2.51v-10.87c0-1.39-1.12-2.51-2.51-2.51h-14.6v-14.6c0-1.39-1.12-2.51-2.51-2.51Z" 
						/>
						<path 
							fill="#155dfc"
							d="M375.25,168.19h-147.08c-23.24,0-42.14,18.9-42.14,42.14v25.66h12.22v-25.66c0-16.5,13.42-29.92,29.92-29.92h102.34v64.62h-35.22c-4.35,0-8.52,1.6-11.76,4.51l-17.74,15.97-17.74-15.97c-3.23-2.91-7.41-4.51-11.76-4.51h-35.45c-1.78-2.67-4.82-4.44-8.27-4.44-5.48,0-9.94,4.46-9.94,9.94s4.46,9.94,9.94,9.94c3.45,0,6.49-1.77,8.27-4.44h35.45c1.63,0,3.19.6,4.4,1.69l25.1,22.6,25.1-22.6c1.21-1.09,2.77-1.69,4.4-1.69h109.88v101.38c0,11.86-6.94,22.14-16.98,26.97v-30.54c0-2.7-2.19-4.89-4.89-4.89s-4.89,2.19-4.89,4.89v33.32c-1.04.11-2.09.17-3.16.17h-1.73v-49.84c0-2.7-2.19-4.89-4.89-4.89s-4.89,2.19-4.89,4.89v49.84h-6.11v-72.61c0-2.7-2.19-4.89-4.89-4.89s-4.89,2.19-4.89,4.89v72.61h-4.89v-99.02c0-2.7-2.19-4.89-4.89-4.89s-4.89,2.19-4.89,4.89v99.02h-105.02c-16.5,0-29.92-13.42-29.92-29.92v-18.21c21.19-.54,42.67,1.91,52.03,3.71,15.88,3.06,27.1,7.19,37.01,10.83,11.02,4.05,21.64,8.73,31.58,13.92.95.49,1.99.74,3.04.74,1.19,0,2.37-.32,3.41-.95,1.87-1.14,2.99-3.1,2.99-5.24v-61.04c0-2.7-2.19-4.89-4.89-4.89s-4.89,2.19-4.89,4.89v55.35c-8.88-4.4-18.23-8.41-27.86-11.95-9.74-3.58-21.87-8.05-38.53-11.25-9.74-1.88-31.98-4.43-53.88-3.89v-64.59h-12.22v92.58c0,23.23,18.9,42.14,42.14,42.14h147.08c23.23,0,42.14-18.9,42.14-42.14v-147.08c0-23.23-18.9-42.14-42.14-42.14ZM341.51,245.03v-64.62h33.74c16.5,0,29.92,13.42,29.92,29.92v34.7h-63.66Z" 
						/>
					</svg> -->

					<svg 
						class="w-7 h-7 text-blue-600" 
						viewBox="150 130 250 330"
						fill="none">
						<path 
							fill="#2463eb"
							d="M269.21,189.19h-10.93c-1.39,0-2.52,1.13-2.52,2.52v14.68h-14.68c-1.39,0-2.52,1.13-2.52,2.52v10.93c0,1.39,1.13,2.52,2.52,2.52h14.68v13.45c0,1.39,1.13,2.52,2.52,2.52h10.93c1.39,0,2.52-1.13,2.52-2.52v-13.45h14.68c1.39,0,2.52-1.13,2.52-2.52v-10.93c0-1.39-1.13-2.52-2.52-2.52h-14.68v-14.68c0-1.39-1.13-2.52-2.52-2.52Z" 
						/>
						<path 
							fill="#155dfc"
							d="M301.84,137.49c-65.8,0-119.55,52.12-119.81,116.18l12.29,.05c.24-57.32,48.47-103.95,107.52-103.95,9.11,0,17.96,1.11,26.42,3.19v109.95h-37.09c-4.22,0-8.27,1.56-11.41,4.38l-18.25,16.43-18.25-16.43c-3.14-2.82-7.19-4.38-11.41-4.38h-35.17c-1.7-2.93-4.87-4.92-8.5-4.92-5.42,0-9.83,4.41-9.83,9.83s4.41,9.83,9.83,9.83c3.63,0,6.8-1.98,8.5-4.92h35.18c1.79,0,3.5,.66,4.83,1.86l24.83,22.35,24.83-22.35c1.33-1.2,3.04-1.85,4.83-1.85h118.2v53.05c0,25.17-9.23,48.3-24.58,66.34v-27.23c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v37.34c-1.6,1.44-3.23,2.84-4.92,4.18v-53.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v60.79c-2,1.26-4.05,2.46-6.14,3.59v-82.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v87.52c-1.62,.68-3.26,1.32-4.92,1.92v-109.1c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v112.14c-8.83,2.28-18.09,3.5-27.65,3.5-42.35,0-79.05-23.89-96.57-58.51,13.95-.03,27.63,1.41,40.73,4.28,15.92,3.49,27.19,8.22,37.13,12.39,11.07,4.64,21.74,10,31.71,15.94,1.01,.6,2.15,.9,3.3,.9s2.2-.28,3.19-.84c2-1.14,3.24-3.27,3.24-5.57v-69.49c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v63.58c-8.86-4.99-18.19-9.55-27.81-13.58-9.81-4.12-22.03-9.24-38.82-12.92-15.15-3.32-31-4.8-47.16-4.44-4.29-11.26-6.64-23.42-6.64-36.11v-44.45h-12.29v44.45c0,64.33,53.75,116.66,119.81,116.66s119.81-52.33,119.81-116.66v-71.65c0-64.33-53.75-116.66-119.81-116.66ZM340.55,262.92v-106.14c40.22,15.12,68.82,53.06,68.82,97.37v8.77h-68.82Z" 
						/>
					</svg>
					
					<p class="text-xl font-bold">
						<span class="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
							Bento
						</span>
					</p>
				</a>

				<!-- 메인 네비게이션 -->
				<nav class="flex flex-1" aria-label="Main navigation">
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

							<!-- Person 메뉴 -->
							<div class="w-[200px]">
								<a 
									href="/person"
									role="menuitem"
									tabindex="-1"
									onmouseenter={() => activeMenu = 'person'}
									class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
										{activeMenu === 'person' ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'} 
										hover:text-slate-900 hover:font-semibold">
									Person
								</a>
							</div>

							<!-- Custom 메뉴 -->
							<div class="w-[200px]">
								<a 
									href="/custom-chart"
									role="menuitem"
									tabindex="-1"
									onmouseenter={() => activeMenu = 'custom'}
									class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
										{activeMenu === 'custom' ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'} 
										hover:text-slate-900 hover:font-semibold">
									Custom Chart
								</a>
							</div>
						</div>
					</div>
					<div class="flex w-full justify-end">
						<div>
							<a 
								href="/login"
								tabindex="-1"
								class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
									hover:text-slate-900 hover:font-semibold">
								Login
							</a>
						</div>
						<div>
							<a 
								href="/register"
								tabindex="-1"
								class="flex items-center h-[60px] w-full px-6 text-[15px] transition-all duration-200
									hover:text-slate-900 hover:font-semibold">
								Register
							</a>
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

							<!-- Person 섹션 -->
							<div class="w-[200px] py-4 border-r border-slate-300">
								<ul class="space-y-3">
									<li>
										<a href="/person" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'person'}>
											Person Search
										</a>
									</li>
								</ul>
							</div>

							<!-- Custom Chart 섹션 -->
							<div class="w-[200px] py-4 border-r border-slate-300">
								<ul class="space-y-3">
									<li>
										<a href="/custom-chart" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'person'}>
											Chart Set List
										</a>
									</li>
									<li>
										<a href="/custom-chart/new" 
											class="block text-sm text-slate-600 hover:text-blue-600 transition-colors px-6"
											onmouseenter={() => activeMenu = 'custom'}>
											Chart Definition
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
