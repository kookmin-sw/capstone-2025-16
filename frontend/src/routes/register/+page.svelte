<script>
	import { ORGANIZATION_AFFILIATIONS } from '$lib/constants';

	let selectedOrg = '';
	let selectedCenter = '';
	let advisor = '';

	let email = '';
	let id = '';
	let password = '';
	let confirmPassword = '';

	let emailError = "";
	let idError = "";
	let passwordError = "";
	let confirmPasswordError = "";
	let orgError = "";
	let centerError = "";

	function isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function isValidId(id) {
		return id.length >= 5 && id.length <= 20;
	}

	function isValidPassword(pw) {
		return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
	}

	function handleSubmit() {
		let valid = true;

		// 필수 유효성 검사
		if (!selectedOrg) {
			orgError = "Please select an organization.";
			valid = false;
		} else {
			orgError = "";
		}

		if (selectedOrg !== "개인연구자" && !selectedCenter) {
			centerError = "Please select a center.";
			valid = false;
		} else {
			centerError = "";
		}

		if (!email || !isValidEmail(email)) {
			emailError = "Please enter a valid email address.";
			valid = false;
		} else {
			emailError = "";
		}

		if (!id || !isValidId(id)) {
			idError = "ID must be between 5 and 20 characters.";
			valid = false;
		} else {
			idError = "";
		}

		if (!password || !isValidPassword(password)) {
			passwordError = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
			valid = false;
		} else {
			passwordError = "";
		}

		if (!confirmPassword || confirmPassword !== password) {
			confirmPasswordError = "Passwords do not match.";
			valid = false;
		} else {
			confirmPasswordError = "";
		}

		if (valid) {
			console.log("🟢 All fields are valid. Proceeding...");
			// submit logic
		}
	}

	$: centers = ORGANIZATION_AFFILIATIONS?.[selectedOrg] || [];
</script>

<svelte:head>
	<title>Register - Bento</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
	<form on:submit|preventDefault={handleSubmit} class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<h1 class="text-3xl font-bold mb-4">Register</h1>

		<!-- Organization -->
		<div class="mb-4">
			<label for="org" class="block font-bold">Organization</label>
			<select id="org" bind:value={selectedOrg} class="border p-2 mt-1 w-full border-gray-300 rounded-md">
				<option value="" disabled selected>Select an Organization</option>
				{#each Object.keys(ORGANIZATION_AFFILIATIONS) as org}
					<option value={org}>{org}</option>
				{/each}
			</select>
			{#if orgError}
				<p class="text-red-500 text-sm mt-1">{orgError}</p>
			{/if}
		</div>

		<!-- Center -->
		<div class="mb-4">
			<label for="center" class="block font-semibold mb-1">Center / Department</label>
			<select
				id="center"
				bind:value={selectedCenter}
				disabled={selectedOrg === '개인연구자'}
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
			>
				<option value="" disabled selected>Select a Center</option>
				{#each centers as center}
					<option value={center}>{center}</option>
				{/each}
			</select>
			{#if centerError}
				<p class="text-red-500 text-sm mt-1">{centerError}</p>
			{/if}
		</div>

		<!-- Advisor (Optional) -->
		<div class="mb-4">
			<label for="advisor" class="block font-semibold mb-1">Advisor (Optional)</label>
			<input
				id="advisor"
				bind:value={advisor}
				disabled={selectedOrg === '개인연구자'}
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
				placeholder="Enter your advisor's name"
			/>
		</div>

		<!-- Email -->
		<div class="mb-4">
			<label for="email" class="block font-semibold mb-1">E-mail</label>
			<input
				id="email"
				bind:value={email}
				type="email"
				autocomplete="email"
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
			/>
			{#if emailError}
				<p class="text-red-500 text-sm mt-1">{emailError}</p>
			{/if}
		</div>

		<!-- ID -->
		<div class="mb-4">
			<label for="id" class="block font-semibold mb-1">ID</label>
			<input
				id="id"
				bind:value={id}
				type="text"
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
			/>
			{#if idError}
				<p class="text-red-500 text-sm mt-1">{idError}</p>
			{/if}
		</div>

		<!-- Password -->
		<div class="mb-4">
			<label for="password" class="block font-semibold mb-1">Password</label>
			<input
				id="password"
				bind:value={password}
				type="password"
				autocomplete="new-password"
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
			/>
			{#if passwordError}
				<p class="text-red-500 text-sm mt-1">{passwordError}</p>
			{/if}
		</div>

		<!-- Confirm Password -->
		<div class="mb-8">
			<label for="confirmPassword" class="block font-semibold mb-1">Confirm Password</label>
			<input
				id="confirmPassword"
				bind:value={confirmPassword}
				type="password"
				autocomplete="current-password"
				class="border p-2 mt-1 w-full border-gray-300 rounded-md"
			/>
			{#if confirmPasswordError}
				<p class="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
			{/if}
		</div>

		<!-- Submit -->
		<button
			type="submit"
			class="w-full px-3 py-2 text-lg font-bold text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
		>
			Register
		</button>
	</form>
</div>
