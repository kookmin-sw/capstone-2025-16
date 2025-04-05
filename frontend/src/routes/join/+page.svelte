<script>
    import { ORGANIZATION_AFFILIATIONS } from '$lib/constants';

    let selectedOrg = '';
    let selectedCenter = '';
    let selectedLab = '';

    let email = '';
    let id = '';
    let password = '';
    let confirmPassword = '';

    let isCheckedEmail = false;
    let isCheckedId = false;
    let isCheckedPassword = false;
    let isCheckedConfirmPassword = false;

    let emailError = "";
    let idError = "";
    let passwordError = "";
    let confirmPasswordError = "";

    // 이메일 형식 검사
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ID 형식 검사: 5~20자
    function isValidId(id) {
        return id.length >= 5 && id.length <= 20;
    }

    // 비밀번호 형식 검사: 영어 + 숫자 + 특수문자
    function isValidPassword(pw) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
    }

    function handleSubmit() {
        if(isCheckedEmail && isCheckedId && isCheckedPassword && isCheckedConfirmPassword){
            console.log("회원가입");
        }
    }

    $: centers = selectedOrg && typeof ORGANIZATION_AFFILIATIONS[selectedOrg] === 'object'
        ? Object.keys(ORGANIZATION_AFFILIATIONS[selectedOrg])
        : [];

    $: labs = selectedCenter && ORGANIZATION_AFFILIATIONS[selectedOrg]?.[selectedCenter]
        ? ORGANIZATION_AFFILIATIONS[selectedOrg][selectedCenter]
        : [];

    $: isActive = ORGANIZATION_AFFILIATIONS[selectedOrg]?.[selectedCenter]?.[selectedLab]
        ? ORGANIZATION_AFFILIATIONS[selectedOrg][selectedCenter][selectedLab]
        : [];

    // 이메일 유효성 검사
    $: {
        if (email.length === 0) {
            emailError = "";
            isCheckedEmail = false;
        } else if (!isValidEmail(email)) {
            emailError = "Please enter a valid email address.";
            isCheckedEmail = false;
        } else {
            emailError = "";
            isCheckedEmail = true;
        }
    }

    // ID 유효성 검사
    $: {
        if (id.length === 0) {
            idError = "";
            isCheckedId = false;
        } else if (!isValidId(id)) {
            idError = "ID must be between 5 and 20 characters.";
            isCheckedId = false;
        } else {
            idError = "";
            isCheckedId = true;
        }
    }

    // 비밀번호 유효성 검사
    $: {
        if (password.length === 0) {
            passwordError = "";
            isCheckedPassword = false;
        } else if (!isValidPassword(password)) {
            passwordError = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
            isCheckedPassword = false;
        } else {
            passwordError = "";
            isCheckedPassword = true;
        }
    }

    // 비밀번호 확인
    $: {
        if (confirmPassword.length === 0 || password.length === 0) {
            confirmPasswordError = "";
            isCheckedConfirmPassword = false;
        } else if (confirmPassword !== password) {
            confirmPasswordError = "Passwords do not match.";
            isCheckedConfirmPassword = false;
        } else {
            confirmPasswordError = "";
            isCheckedConfirmPassword = true;
        }
    }
</script>


<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <form on:submit|preventDefault={handleSubmit} class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-3xl font-bold mb-4">Register</h1>
        <div class="mb-4">
            <label for="org" class="block font-bold">Organization</label>
            <select id="org" bind:value={selectedOrg} class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="" disabled selected>Select a Organization</option>
                {#each Object.keys(ORGANIZATION_AFFILIATIONS) as org}
                    <option value={org}>{org}</option>
                {/each}
            </select>
        </div>
        
        {#if centers.length > 0}
            <!-- Center -->
            <div class="mb-4">
                <label for="center" class="block font-semibold mb-1">Center / Department</label>
                <select id="center" bind:value={selectedCenter} class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="" disabled selected>Select a center</option>
                    {#each centers as center}
                        <option value={center}>{center}</option>
                    {/each}
                </select>
            </div>
        {/if}
        
        {#if labs.length > 0}
            <!-- Lab -->
            <div class="mb-4">
                <label for="lab" class="block font-semibold mb-1">Lab</label>
                <select for="lab" bind:value={selectedLab} class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="" disabled selected>Select a lab</option>
                    {#each labs as lab, index}
                        <option value={index}>{lab}</option>
                    {/each}
                </select>
            </div>
        {/if}

        {#if selectedOrg === "개인연구자" || isActive.length > 0}
            <div class="mb-4">
                <label for="email" class="block font-semibold mb-1">E-mail</label>
                <input id="email" bind:value={email} type="email" autocomplete="email" class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                {#if emailError}
                    <p class="text-red-500 text-sm mt-1">{emailError}</p>
                {/if}
            </div>

            {#if isCheckedEmail}
                <!-- ID -->
                <div class="mb-4">
                    <label for="id" class="block font-semibold mb-1">ID</label>
                    <input id="id" bind:value={id} type="text" class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    {#if idError}
                        <p class="text-red-500 text-sm mt-1">{idError}</p>
                    {/if}
                </div>
            {/if}
            
            {#if isCheckedId}
                <!-- Password -->
                <div class="mb-4">
                    <label for="password" class="block font-semibold mb-1">Password</label>
                    <input id="password" bind:value={password} type="password" autocomplete="new-password" class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    {#if passwordError}
                        <p class="text-red-500 text-sm mt-1">{passwordError}</p>
                    {/if}
                </div>
            
                <!-- Confirm Password -->
                <div class="mb-8">
                    <label for="confirmPassword" class="block font-semibold mb-1">Confirm Password</label>
                    <input id="confirmPassword" bind:value={confirmPassword} type="password" autocomplete="current-password" class="border p-2 mt-1 w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    {#if confirmPasswordError}
                        <p class="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
                    {/if}
                </div>
            {/if}

            {#if isCheckedConfirmPassword}
                <button type="submit" class="w-full px-3 py-2 text-lg font-bold text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                    Register
                </button>
            {/if}
        {/if}
    </form>
</div>
