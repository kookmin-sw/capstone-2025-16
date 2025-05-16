<!-- 
  Container Header Component
  Features:
  - Displays container name with edit functionality
  - Shows patient count badge
  - Includes container operation selector (AND/OR/NOT)
  - Provides action buttons
-->
<script>
	// Container props
	export let name = 'Container';
	export let operator = 'AND';
	export let patientCount = null;
	export let canRemove = true;
	export let isFirstContainer = false;
	export let groupType = 'initialGroup';
	export let containerIndex = 0;
	export let isLoading = false;

	// Event handlers
	export let onContainerNameChange = (groupType, index, name) => {};
	export let onOperatorChange = (groupType, index, operator) => {};
	export let onAddFilter = (groupType, index) => {};
	export let onRemove = (groupType, index) => {};
</script>

<div class="mb-4 flex w-full items-center">
	<div class="flex w-full items-center pr-8">
		{#if !isFirstContainer}
			<select
				class="mr-2 rounded border border-gray-300 bg-gray-50 px-2 py-1 pr-8 text-sm"
				value={operator}
				on:change={(e) => onOperatorChange(groupType, containerIndex, e.target.value)}
			>
				<option value="AND">AND</option>
				<option value="OR">OR</option>
				<option value="NOT">NOT</option>
			</select>
		{/if}
		<div class="flex w-full space-x-8">
			<div class="flex w-full flex-col">
				<div class="flex w-full items-center text-lg font-medium text-blue-600">
					<svg
						class="h-4 w-4 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
					<input
						type="text"
						class="w-full rounded border-0 bg-transparent p-0 text-lg font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 focus:ring-0"
						value={name}
						on:change={(e) => onContainerNameChange(groupType, containerIndex, e.target.value)}
					/>
				</div>
				{#if patientCount !== null}
					<div class="mt-1 flex items-center">
						<span
							class="flex items-center rounded-full px-2 py-0.5 text-xs font-medium {isLoading
								? 'bg-gray-100 text-gray-800'
								: 'bg-green-100 text-green-800'}"
						>
							<svg
								class="-ml-0.5 mr-1 inline h-2 w-2 {isLoading ? 'text-gray-400' : 'text-green-400'}"
								fill="currentColor"
								viewBox="0 0 8 8"
							>
								<circle cx="4" cy="4" r="3" />
							</svg>
							Patients:
							{#if isLoading}
								<svg
									class="ml-1 h-3 w-3 animate-spin text-gray-500"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else}
								{patientCount.toLocaleString()}
							{/if}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="flex w-fit space-x-2">
		<button
			class="whitespace-nowrap text-sm text-blue-500 hover:text-blue-700"
			on:click={() => onAddFilter(groupType, containerIndex)}
		>
			Add Filter
		</button>
		<button
			class="whitespace-nowrap text-sm text-red-500 hover:text-red-700"
			on:click={() => onRemove(groupType, containerIndex)}
		>
			Remove
		</button>
	</div>
</div>
