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
            <img src="/logo.svg" alt="Logo" class="mx-auto w-16 h-16 mb-2" />
            <h1 class="text-3xl font-bold text-gray-800">Welcome to Bento</h1>
            <p class="text-gray-500 mt-1">Your gateway to intelligent patient data insights</p>
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
