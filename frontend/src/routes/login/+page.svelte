<script>
    import Footer from "$lib/components/Footer.svelte";

	let id = '';
	let password = '';
	let loginError = '';
	
	function handleLogin() {
		if (!id || !password) {
			loginError = 'Please fill in both ID and Password.';
			return;
		}
		// 실제 로그인 로직 (예: API 호출)
		console.log('Logging in with', id, password);
	}
</script>

<div class="flex items-center justify-center">
    <div class="flex items-center justify-center min-h-[calc(100vh-60px)] w-[50vw] bg-gradient-to-b from-white to-blue-50 ">
    	<!-- Header with Logo and Slogan -->
        <div class="text-center w-[45%]">
            <div class="flex flex-col items-center justify-center">
                <svg 
                    class="w-50 h-50 mx-auto mb-4" 
                    viewBox="130 130 340 340"
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
                <h1 class="text-3xl font-bold text-gray-800">Welcome to Bento</h1>
                <p class="text-gray-500 mt-2">Your gateway to intelligent patient data insights</p>
            </div>
        </div>
    </div>

    <div class="flex justify-center min-h-[calc(100vh-60px)] w-[50vw] bg-gradient-to-b from-blue-50 to-white">
        <!-- Login Form -->
        <div class="flex justify-center items-center mt-10 w-[400px]">
            <form
                on:submit|preventDefault={handleLogin}
                class="max-w-[500px] w-full bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
                <h2 class="text-xl font-semibold mb-4 text-center">Login</h2>

                <div class="mb-4">
                    <label for="id" class="block text-sm font-medium text-gray-700">ID</label>
                    <input
                        id="id"
                        type="text"
                        bind:value={id}
                        placeholder="Enter ID"
                        class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <div class="mb-4">
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        id="password"
                        type="password"
                        bind:value={password}
                        placeholder="Enter Password"
                        autocomplete="current-password"
                        class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                {#if loginError}
                    <p class="text-red-500 text-sm mb-2">{loginError}</p>
                {/if}

                <button
                    type="submit"
                    class="w-full mt-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Login
                </button>
            </form>
        </div>
    </div>
	
</div>
