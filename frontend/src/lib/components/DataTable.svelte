<script>
  export let headers = [];  // [{key: 'rank', label: 'Rank'}, ...]
  export let data = [];    // [{rank: 1, name: 'Drug A', count: 100}, ...]

</script>

<svelte:window on:click={handleClickOutside}/>

<div class="flex flex-col">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          {#each headers as header}
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each data as row}
          <tr class="hover:bg-gray-50">
            {#each headers as header}
              <td class="px-4 py-2 whitespace-nowrap text-xs {header.key === 'name' ? 'font-medium text-gray-900' : 'text-gray-500'}">
                {row[header.key]}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
