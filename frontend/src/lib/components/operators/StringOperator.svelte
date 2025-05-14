<!-- 
  String operator component
  Features:
  - Supports string operators (eq, neq, startsWith, endsWith, contains)
  - Supports single value or multiple values
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// String operator type definition
	type StringOperatorType = {
		eq?: string | string[];
		neq?: string | string[];
		startsWith?: string | string[];
		endsWith?: string | string[];
		contains?: string | string[];
		[key: string]: string | string[] | undefined;
	};

	export let value: StringOperatorType = {};

	export let placeholder = 'Enter text';
	export let label = 'Value';

	const dispatch = createEventDispatcher();

	// All available operators list - defined first
	const availableOperators = [
		{ type: 'eq', label: 'Equal to (=)', icon: '=' },
		{ type: 'neq', label: 'Not equal to (≠)', icon: '≠' },
		{ type: 'startsWith', label: 'Starts with', icon: '→' },
		{ type: 'endsWith', label: 'Ends with', icon: '←' },
		{ type: 'contains', label: 'Contains', icon: '⊃' }
	];

	// Active operator types - initialized after availableOperators
	let activeOperators = getActiveOperators();
	// Operator values (single value)
	let operatorValues: { [key: string]: string } = getOperatorValues();
	// Multiple mode status for each operator
	let isMultipleMode: { [key: string]: boolean } = getMultipleModes();
	// Multiple values for each operator
	let multipleValues: { [key: string]: string[] } = getMultipleValues();

	// New value input
	let newValues: { [key: string]: string } = {};

	// Check active operators
	function getActiveOperators(): string[] {
		const active = [];
		for (const op of availableOperators) {
			if (value[op.type] !== undefined) {
				active.push(op.type);
			}
		}
		return active.length > 0 ? active : []; // Default
	}

	// Get values for each operator
	function getOperatorValues(): { [key: string]: string } {
		const values: { [key: string]: string } = {};
		for (const op of availableOperators) {
			const currentValue = value[op.type];
			if (currentValue !== undefined && !Array.isArray(currentValue)) {
				values[op.type] = currentValue.toString();
			} else {
				values[op.type] = '';
			}
		}
		return values;
	}

	// Get multiple mode status for each operator
	function getMultipleModes(): { [key: string]: boolean } {
		const modes: { [key: string]: boolean } = {};
		for (const op of availableOperators) {
			modes[op.type] = Array.isArray(value[op.type]);
		}
		return modes;
	}

	// Get multiple values for each operator
	function getMultipleValues(): { [key: string]: string[] } {
		const values: { [key: string]: string[] } = {};
		for (const op of availableOperators) {
			const currentValue = value[op.type];
			if (Array.isArray(currentValue)) {
				values[op.type] = currentValue;
			} else {
				values[op.type] = [];
			}
		}
		return values;
	}

	// Add operator
	function addOperator(type: string) {
		if (!activeOperators.includes(type)) {
			activeOperators = [...activeOperators, type];
			updateValue();
		}
	}

	// Remove operator
	function removeOperator(type: string) {
		activeOperators = activeOperators.filter((op) => op !== type);
		updateValue();
	}

	// Handle single value change
	function handleValueChange(type: string, e: Event) {
		const target = e.target as HTMLInputElement;
		operatorValues[type] = target.value;
		updateValue();
	}

	// Toggle multiple mode
	function toggleMultipleMode(type: string) {
		isMultipleMode[type] = !isMultipleMode[type];

		if (isMultipleMode[type]) {
			// Convert single value to multiple values
			if (operatorValues[type]) {
				multipleValues[type] = [operatorValues[type]];
				operatorValues[type] = '';
			}
		} else {
			// Convert multiple values to single value
			if (multipleValues[type].length > 0) {
				operatorValues[type] = multipleValues[type][0];
				multipleValues[type] = [];
			}
		}

		updateValue();
	}

	// Handle new value input change
	function handleNewValueChange(type: string, e: Event) {
		const target = e.target as HTMLInputElement;
		newValues[type] = target.value;
	}

	// Add new value
	function addValue(type: string) {
		if (newValues[type] && !multipleValues[type].includes(newValues[type])) {
			multipleValues[type] = [...multipleValues[type], newValues[type]];
			newValues[type] = '';
			updateValue();
		}
	}

	// Remove value
	function removeValue(type: string, index: number) {
		multipleValues[type].splice(index, 1);
		multipleValues[type] = [...multipleValues[type]];
		updateValue();
	}

	// Update value and dispatch event
	function updateValue() {
		// Initialize new value
		let updatedValue: StringOperatorType = {};

		// Process each active operator
		for (const type of activeOperators) {
			if (isMultipleMode[type]) {
				// Process multiple values
				if (multipleValues[type] && multipleValues[type].length > 0) {
					updatedValue[type] = multipleValues[type];
				}
			} else {
				// Process single value
				if (operatorValues[type]) {
					updatedValue[type] = operatorValues[type];
				}
			}
		}

		dispatch('change', updatedValue);
	}

	// Get operator label
	function getOperatorLabel(type: string): string {
		const op = availableOperators.find((o) => o.type === type);
		return op ? op.label : type;
	}

	// Get operator icon
	function getOperatorIcon(type: string): string {
		const op = availableOperators.find((o) => o.type === type);
		return op ? op.icon : type;
	}
</script>

<div class="string-operator">
	<div class="flex flex-col space-y-4">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-700">{label}</span>

			<!-- Add operator dropdown -->
			{#if activeOperators.length < availableOperators.length}
				<div class="relative">
					<select
						class="rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						on:change={(e) => {
							const target = e.target as HTMLSelectElement;
							if (target.value) {
								addOperator(target.value);
								target.value = '';
							}
						}}
					>
						<option value="">Add operator</option>
						{#each availableOperators.filter((op) => !activeOperators.includes(op.type)) as op}
							<option value={op.type}>{op.label}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- Active operators -->
		{#each activeOperators as type}
			<div
				class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600"
						>
							{getOperatorIcon(type)}
						</span>
						<span class="text-sm font-medium text-gray-700">{getOperatorLabel(type)}</span>
					</div>

					<div class="flex items-center space-x-2">
						<!-- Single/multiple value mode toggle button -->
						<button
							type="button"
							class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
							on:click={() => toggleMultipleMode(type)}
						>
							{isMultipleMode[type] ? 'Multiple' : 'Single'}
						</button>

						<!-- Remove operator button -->

						<button
							type="button"
							class="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
							on:click={() => removeOperator(type)}
						>
							Remove
						</button>
					</div>
				</div>

				{#if isMultipleMode[type]}
					<!-- Multiple value input UI -->
					<div class="space-y-3">
						<div class="flex items-center space-x-2">
							<input
								type="text"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Add value..."
								value={newValues[type] || ''}
								on:input={(e) => handleNewValueChange(type, e)}
								on:keypress={(e) => e.key === 'Enter' && addValue(type)}
							/>
							<button
								type="button"
								class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								on:click={() => addValue(type)}
							>
								Add
							</button>
						</div>

						{#if multipleValues[type]?.length > 0}
							<div
								class="max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2"
							>
								{#each multipleValues[type] as val, i}
									<div
										class="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-sm shadow-sm"
									>
										<span class="font-medium text-gray-700">{val}</span>
										<button
											type="button"
											class="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
											on:click={() => removeValue(type, i)}
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-center text-xs text-gray-500">Add at least one value</p>
						{/if}
					</div>
				{:else}
					<!-- Single value input UI -->
					<input
						type="text"
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						{placeholder}
						value={operatorValues[type] || ''}
						on:input={(e) => handleValueChange(type, e)}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* 스크롤바 스타일링 */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}
</style>
