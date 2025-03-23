<script>
  export let data = { headers: [], rows: [] };

  $: headers = data.headers;
  $: rows = data.rows;
</script>

<div class="flex flex-col">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          {#each headers as header}
            <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each rows as row}
          <tr class="hover:bg-gray-50">
            {#each headers as header}
              <td class="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                {row[header].toLocaleString()}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
