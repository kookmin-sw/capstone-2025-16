<script>
    import { goto } from "$app/navigation";

    export let children;

    let searchInput = '';
    let error = '';
    let personData = null;
    let loading = false;

    async function handleSearch() {
        if (!searchInput.trim()) {
            error = 'Please enter the patient ID';
            return;
        }
        error = '';
        loading = true;

        try {
            const response = await fetch('/user-testdata.json');
            const data = await response.json();

            const matchedPerson = data.find((item) => item.personid.toString() === searchInput.trim());

            if (!matchedPerson) {
                error = 'Patient ID not found';
                personData = null;
                return;
            }
            
            goto(`/person/${searchInput}`);
            personData = matchedPerson;
        } catch (err) {
            error = 'An error occurred while loading data';
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

<div class="fixed left-0 top-[60px] w-full min-h-screen bg-gray-50">
    <!-- Search Section -->
    <div class="bg-white shadow-sm">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center gap-4">
                <input
                    type="text"
                    bind:value={searchInput}
                    on:keypress={handleKeyPress}
                    placeholder="Enter Patient ID"
                    class="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

<div>
    {@render children()}
</div>