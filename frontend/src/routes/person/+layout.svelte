<script>
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URI } from '$env/static/public';
    export let children;

    let searchInput = null;
    let error = '';
    let personData = null;
    let loading = false;

    async function handleSearch() {
        if (searchInput === null) {
            error = 'Please enter the patient ID';
            return;
        }
        error = '';
        loading = true;

        try {
            const response = await fetch(`${PUBLIC_API_URI}/api/person/${searchInput}/`);
            if(!response.ok){
                error = 'Patient ID not found';
                personData = null;
                goto(`/person`);
                return;
            }

            const data = await response.json();
            
            goto(`/person/${searchInput}`);
            personData = data;
        } catch (err) {
            error = 'An error occurred while loading data';
            goto(`/person`);
            personData = null;
        } finally {
            loading = false;
        }
    }


    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }
</script>

<svelte:head>
  <title>Patient CDM - Bento</title>
</svelte:head>

<div>
    <div class="w-full bg-gray-50">
        <!-- Search Section -->
        <div class="bg-white shadow-sm">
            <div class="container mx-auto w-[85%] py-4">
                <div class="flex items-center justify-center gap-4">
                    <input
                        type="text"
                        bind:value={searchInput}
                        on:keypress={handleKeyPress}
                        placeholder="Enter Patient ID"
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        on:click={handleSearch}
                        class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Search
                    </button>
                </div>
                {#if error}
                    <p class="text-red-500 mt-2">{error}</p>
                {/if}
            </div>
        </div>
    </div>
    <div class="flex justify-center w-full">
        <div class="w-[85%]">
            {@render children()}
        </div>
    </div>
</div>