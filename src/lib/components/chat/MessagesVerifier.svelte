<script lang="ts">
	import { getMessageSignature } from '$lib/apis/nearai';

	export let chatId: string;
	export let token: string;

	let loading = false;
	let error: string | null = null;
	let signatureData: any = null;
	let selectedModelForSignature = '';
	let signingAlgorithm = 'ecdsa';

	// Function to fetch message signature
	const fetchMessageSignature = async () => {
		if (!chatId || !token || !selectedModelForSignature) return;

		loading = true;
		error = null;

		try {
			const data = await getMessageSignature(token, chatId, selectedModelForSignature, undefined, signingAlgorithm);
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
</script>

<div class="space-y-4">
	<!-- Signing Algorithm Selection -->
	<div>
		<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
			Signing Algorithm
		</label>
		<select
			bind:value={signingAlgorithm}
			class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
		>
			<option value="ecdsa">ECDSA</option>
			<option value="ed25519">Ed25519</option>
		</select>
	</div>

	<!-- Verify Button -->
	<button
		on:click={verifyMessageSignature}
		disabled={!selectedModelForSignature || loading}
		class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
	>
		{loading ? 'Verifying...' : 'Verify Message Signature'}
	</button>

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-4">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
			<span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Verifying signature...</span>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
			<div class="flex items-center">
				<svg class="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<span class="text-red-800 dark:text-red-200 text-sm">{error}</span>
			</div>
		</div>
	{:else if signatureData}
		<!-- Signature Results -->
		<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
			<div class="flex items-center mb-2">
				<svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clip-rule="evenodd" />
				</svg>
				<span class="text-green-800 dark:text-green-200 text-sm font-medium">Signature Verified</span>
			</div>
			
			<div class="space-y-2 text-xs">
				{#if signatureData.signature}
					<div>
						<label class="block text-gray-700 dark:text-gray-300 font-medium">Signature:</label>
						<textarea
							readonly
							class="w-full h-16 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded resize-none"
						>{signatureData.signature}</textarea>
					</div>
				{/if}
				{#if signatureData.public_key}
					<div>
						<label class="block text-gray-700 dark:text-gray-300 font-medium">Public Key:</label>
						<input
							type="text"
							readonly
							value={signatureData.public_key}
							class="w-full px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
						/>
					</div>
				{/if}
				{#if signatureData.algorithm}
					<div>
						<label class="block text-gray-700 dark:text-gray-300 font-medium">Algorithm:</label>
						<span class="text-gray-900 dark:text-gray-100">{signatureData.algorithm}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
