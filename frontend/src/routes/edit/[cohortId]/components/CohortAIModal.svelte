<script>
	export let show = false;

	// Callback functions
	export let onClose = () => {};
	export let onSubmit = () => {};

	// Active tab - "text" or "file"
	let activeTab = 'text';

	// Form data
	let files = [];
	let cohortText = '';
	let isLoading = false;

	// Generated cohort data
	let generatedCohort = null;
	let checkedCohortText = {
		non_implementable_text: '',
		implementable_text: ''
	};
	let isApplyingCohort = false;
	let generationStep = ''; // "generated", "generating", "applying", "completed", "checking"

	// Handle file upload
	function handleFileUpload(event) {
		const uploadedFiles = event.target.files;
		if (uploadedFiles.length > 0) {
			files = [...files, ...Array.from(uploadedFiles)];
		}
	}

	// Generate cohort based on inputs
	async function generateCohortbyPDF() {
		if (activeTab === 'file' && files.length === 0) {
			alert('논문 파일을 업로드해주세요');
			return;
		}

		isLoading = true;

		// Here would be the actual API call to generate the cohort
		// For now, simulate a response

		const formData = new FormData();
		formData.append('pdf', files[0]);
		await fetch('https://bento.kookm.in/api/autocohort/pdf', {
			method: 'POST',
			body: formData
		})
			.then((res) => res.json())
			.then((data) => {
				checkedCohortText = data;
				generationStep = 'checking';
				isLoading = false;
			});
	}

	function applyCohort() {
		generationStep = 'applying';
		isLoading = true;
		setTimeout(() => {
			onSubmit(generatedCohort);
			generationStep = 'completed';
			isLoading = false;
		}, 1000);
	}

	// Apply cohort definition to create the actual cohort
	async function generateCohortbyText() {
		// Simulate cohort creation process
		generatedCohort = true;
		generationStep = 'generating';
		await fetch('https://bento.kookm.in/api/autocohort/text', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				text: cohortText
			})
		})
			.then((res) => res.json())
			.then((data) => {
				generatedCohort = data;
				generationStep = 'preview';
			});
	}

	// Reset the form
	function resetForm() {
		cohortText = '';
		files = [];
		generatedCohort = null;
		editableSummary = '';
		generationStep = '';
	}

	// Remove file from list
	function removeFile(index) {
		files = files.filter((_, i) => i !== index);
	}

	// Switch to text tab
	function switchToTextTab() {
		activeTab = 'text';
	}

	// Switch to file tab
	function switchToFileTab() {
		activeTab = 'file';
	}

	// Go back from results to input
	function goBackToInput() {
		generatedCohort = null;
		editableSummary = '';
		generationStep = '';
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="flex h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-4">
				<h2 class="text-xl font-bold text-gray-800">Cohort AI</h2>
				<button
					class="text-gray-500 hover:text-gray-700"
					on:click={onClose}
					disabled={isLoading || isApplyingCohort}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content Area -->
			<div class="flex-1 overflow-auto p-6">
				<!-- Results View -->
				{#if generationStep === 'completed'}
					<!-- Completion View -->
					<div class="py-12 text-center">
						<div
							class="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
						>
							<svg
								class="h-6 w-6 text-green-600"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h3 class="text-lg font-medium text-gray-900">Cohort Generation Completed</h3>
						<p class="mt-2 text-sm text-gray-500">The cohort has been successfully generated.</p>
					</div>
				{:else if generationStep === 'generating'}
					<!-- Processing View -->
					<div class="py-12 text-center">
						<div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full">
							<svg
								class="h-8 w-8 animate-spin text-blue-600"
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
						</div>
						<h3 class="text-lg font-medium text-gray-900">Generating Cohort</h3>
						<p class="mt-2 text-sm text-gray-500">
							We are generating your requested cohort. Please wait a moment.
						</p>
					</div>
				{:else if generationStep === 'preview'}
					<!-- Editable Summary View -->
					<div class="mb-6 h-full">
						<div class="flex justify-between">
							<h3 class="mb-2 font-semibold text-gray-800">Generated Cohort Structure</h3>
							<button
								class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								on:click={applyCohort}
							>
								Apply
							</button>
						</div>
						<textarea
							value={JSON.stringify(generatedCohort, null, 2)}
							disabled
							class="h-full w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						></textarea>
						<!-- Action Buttons -->
					</div>
				{:else if generationStep === 'checking'}
					<!-- Editable Summary View -->
					<div class="mb-6">
						<h3 class="mb-2 font-semibold text-gray-800">Generated Cohort Summary (Editable)</h3>
						<textarea
							bind:value={checkedCohortText.implementable_text}
							rows="8"
							class="w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">Review the summary and modify it as needed.</p>
					</div>

					<div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
						<h3 class="mb-2 font-semibold text-gray-700">Non-Implementable summary in the PDF</h3>
						<textarea
							value={checkedCohortText.non_implementable_text}
							rows={10}
							disabled
							class="w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						></textarea>
					</div>

					<!-- Action Buttons -->
					<div class="mt-6 flex justify-end space-x-4">
						<button
							class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
							on:click={goBackToInput}
						>
							Cancel
						</button>
						<button
							class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
							on:click={() => {
								cohortText = checkedCohortText.implementable_text;
								generateCohortbyText();
							}}
						>
							Generate
						</button>
					</div>
				{:else}
					<!-- Tabs -->
					<div class="mb-6">
						<div class="border-b border-gray-200">
							<div class="flex">
								<button
									class="px-6 py-3 text-sm font-medium {activeTab === 'text'
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'}"
									on:click={switchToTextTab}
								>
									Input Text
								</button>
								<button
									class="px-6 py-3 text-sm font-medium {activeTab === 'file'
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'}"
									on:click={switchToFileTab}
								>
									Upload PDF
								</button>
							</div>
						</div>
					</div>

					<!-- Input View -->
					<div>
						<div class="mb-8 text-center">
							<div class="mb-3 inline-block rounded-full bg-blue-100 p-3">
								{#if activeTab === 'text'}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 text-blue-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 text-blue-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
										/>
									</svg>
								{/if}
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-800">
								{#if activeTab === 'text'}
									Input the cohort definition criteria in text.
								{:else}
									Upload the PDF file containing the cohort definition.
								{/if}
							</h3>
							<p class="text-sm text-gray-600">
								{#if activeTab === 'text'}
									Input the cohort definition criteria, including inclusion/exclusion criteria, in natural language.
								{:else}
									Upload the PDF file containing the cohort definition.
								{/if}
							</p>
						</div>

						{#if activeTab === 'text'}
							<!-- Text Input -->
							<div>
								<textarea
									bind:value={cohortText}
									rows="10"
									class="w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter the cohort definition criteria directly here. For example: 'Patients with hypertension aged 50 and older, who have visited the hospital at least twice in the past 5 years...'"
								></textarea>
							</div>
						{:else}
							<!-- File Upload -->
							<div>
								<div class="flex w-full items-center justify-center">
									<label
										class="flex h-40 w-full cursor-pointer flex-col rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
									>
										<div class="flex flex-col items-center justify-center pb-7 pt-7">
											<svg
												class="mb-3 h-10 w-10 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
												></path>
											</svg>
											<p class="mb-2 text-sm text-gray-500">
												<span class="font-semibold">Click to select a file</span> or drag and drop here
											</p>
											<p class="text-xs text-gray-500">Only PDF files are allowed</p>
										</div>
										<input type="file" class="hidden" accept=".pdf" on:change={handleFileUpload} />
									</label>
								</div>

								<!-- Uploaded Files List -->
								{#if files.length > 0}
									<div class="mt-6">
										<h4 class="mb-2 text-sm font-medium text-gray-700">
											Uploaded files ({files.length})
										</h4>
										<div class="max-h-40 space-y-2 overflow-y-auto pr-2">
											{#each files as file, index}
												<div
													class="flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm"
												>
													<div class="flex items-center">
														<svg
															class="mr-2 h-5 w-5 text-red-500"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																fill-rule="evenodd"
																d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
																clip-rule="evenodd"
															></path>
														</svg>
														<span class="max-w-md truncate text-gray-800">{file.name}</span>
													</div>
													<button
														class="text-gray-500 hover:text-red-500"
														on:click={() => removeFile(index)}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
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
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			{#if !generatedCohort || (generationStep !== 'applying' && generationStep !== 'completed')}
				<div class="flex items-center justify-end space-x-4 border-t border-gray-200 p-4">
					{#if isLoading}
						<div class="mr-auto flex items-center">
							<svg
								class="mr-3 h-5 w-5 animate-spin text-blue-600"
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
							<span class="text-sm text-gray-600">Generating cohort summary...</span>
						</div>
					{/if}

					<button
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						on:click={onClose}
						disabled={isLoading}
					>
						취소
					</button>

					{#if generationStep === ''}
						{#if activeTab === 'text'}
							<button
								class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								on:click={generateCohortbyText}
								disabled={isLoading || (activeTab === 'text' && !cohortText.trim())}
							>
								Generate Cohort
							</button>
						{:else}
							<button
								class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								on:click={generateCohortbyPDF}
								disabled={isLoading || (activeTab === 'file' && files.length === 0)}
							>
								Generate Cohort Summary
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
