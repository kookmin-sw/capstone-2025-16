<script>
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

<div class="min-h-screen bg-gray-50">
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

    <!-- Result Section -->
    <div class="container mx-auto px-4 py-8">
        {#if loading}
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        {:else if personData}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!--내용 추가-->
            </div>
        {/if}
    </div>
</div>
