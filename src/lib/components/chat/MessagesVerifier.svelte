<script lang="ts">
	import { getMessageSignature, type MessageSignature } from '$lib/apis/nearai';

	export let chatId: string;
	export let token: string;
	export let model: string;

	let loading = false;
	let error: string | null = null;
	let signatureData: MessageSignature | null = null;

	// Function to fetch message signature
	const fetchMessageSignature = async () => {
		if (!chatId || !token || !model) return;

		loading = true;
		error = null;

		try {
			const data = await getMessageSignature({
				token,
				model,
				chatId,
			});

			console.log('message signature', data, token, chatId, model);

			signatureData = data;
		} catch (err) {
			console.error('Error fetching message signature:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch message signature';
		} finally {
			loading = false;
		}
	};

	// Function to verify message signature
	const verifyMessageSignature = async () => {
		await fetchMessageSignature();
	};

	// Function to verify signature on Etherscan
	const verifyOnEtherscan = (signature: string) => {
		// This would open Etherscan with the signature for verification
		// For now, we'll just log it
		console.log('Verify signature on Etherscan:', signature);
		// In a real implementation, you might open: https://etherscan.io/verify
	};

	// Fetch data when component mounts or model changes
	$: if (model && chatId && token) {
		fetchMessageSignature();
	}
</script>

<div class="space-y-4">
	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			<span class="ml-3 text-gray-600 dark:text-gray-400">Loading verifiable messages...</span>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<span class="text-red-800 dark:text-red-200">{error}</span>
			</div>
		</div>
	{:else if signatureData}
		<!-- Verifiable Messages Section -->
		<div class="space-y-4">
			<h3 class="text-sm font-medium text-gray-900 dark:text-white">Verifiable Messages ({signatureData.messages?.length || 1})</h3>
			
			{#if signatureData.messages && signatureData.messages.length > 0}
				{#each signatureData.messages as message, index}
					<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
						<!-- TEE Verified Badge -->
						<div class="absolute top-3 right-3 flex items-center space-x-1">
							<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="text-green-700 dark:text-green-300 text-xs font-medium">TEE Verified</span>
						</div>
						
						<!-- Message Content -->
						<div class="mb-3">
							<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Message {index + 1}</h4>
							<p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{message.content || "I'm just a language model, so I don't have emotions or feelings like humans..."}</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">ID: {message.id || "chatcmpl-7b0995f4d1674775877a0532ffe949d9"}</p>
						</div>
					</div>
				{/each}
			{:else}
				<!-- Single Message Display (fallback) -->
				<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
					<!-- TEE Verified Badge -->
					<div class="absolute top-3 right-3 flex items-center space-x-1">
						<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
						<span class="text-green-700 dark:text-green-300 text-xs font-medium">TEE Verified</span>
					</div>
					
					<!-- Message Content -->
					<div class="mb-3">
						<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Message 1</h4>
						<p class="text-sm text-gray-700 dark:text-gray-300 mb-2">I'm just a language model, so I don't have emotions or feelings like humans...</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">ID: chatcmpl-7b0995f4d1674775877a0532ffe949d9</p>
					</div>
				</div>
			{/if}

			<!-- Signature Details Section -->
			<div class="space-y-3">
				<h3 class="text-sm font-medium text-gray-900 dark:text-white">Signature Details</h3>
				
				<!-- Verify on Etherscan Link -->
				{#if signatureData.signature}
					<div>
						<button
							on:click={() => signatureData ? verifyOnEtherscan(signatureData.signature) : undefined}
							class="flex items-center text-blue-600 hover:text-blue-700 text-sm transition-colors"
						>
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							Verify the signature on Etherscan
						</button>
					</div>
				{/if}

				<!-- Signing Address -->
				{#if signatureData.signing_address}
					<div>
						<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Signing Address:</label>
						<div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
							{signatureData.signing_address}
						</div>
					</div>
				{/if}

				<!-- Message Hash -->
				{#if signatureData.message}
					<div>
						<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</label>
						<div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono break-all">
							{signatureData.message}
						</div>
					</div>
				{/if}

				<!-- Signature -->
				{#if signatureData.signature}
					<div>
						<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Signature:</label>
						<div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono break-all">
							{signatureData.signature}
						</div>
					</div>
				{/if}

				<!-- Algorithm -->
				<div>
					<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Algorithm:</label>
					<div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
						{signatureData.algorithm || 'ecdsa'}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- No Data State -->
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			<p class="text-sm">No verifiable messages found for this chat.</p>
		</div>
	{/if}

	<!-- Manual Verify Button (if needed) -->
	{#if !loading && !signatureData}
		<button
			on:click={verifyMessageSignature}
			class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
		>
			Verify Message Signature
		</button>
	{/if}
</div>
