<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getModelAttestationReport } from '$lib/apis/nearai';
	import { fade, slide } from 'svelte/transition';

	export let model: string;
	export let token: string;
	export let show = false;

	const dispatch = createEventDispatcher();

	let loading = false;
	let error: string | null = null;
	let attestationData: any = null;
	let expandedSections = {
		gpu: false,
		tdx: false
	};

	// Function to fetch attestation report
	const fetchAttestationReport = async () => {
		if (!model || !token) return;

		loading = true;
		error = null;

		try {
			attestationData = await getModelAttestationReport({
				token,
				model,
			});
		} catch (err) {
			console.error('Error fetching attestation report:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch attestation report';
		} finally {
			loading = false;
		}
	};

	// Function to verify again
	const verifyAgain = async () => {
		await fetchAttestationReport();
	};

	// Function to close modal
	const closeModal = () => {
		dispatch('close');
	};

	// Toggle section expansion
	const toggleSection = (section: 'gpu' | 'tdx') => {
		expandedSections[section] = !expandedSections[section];
		expandedSections = { ...expandedSections };
	};

	// Fetch data when component mounts or model changes
	$: if (show && model && token) {
		fetchAttestationReport();
	}

	// Reset data when modal closes
	$: if (!show) {
		attestationData = null;
		error = null;
		expandedSections = { gpu: false, tdx: false };
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		on:click={closeModal}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
			transition:slide={{ duration: 300 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Model Verification</h2>
				<button
					on:click={closeModal}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Model Info -->
				<div class="mb-6">
					<h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Verifying Model</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">{model}</p>
				</div>

				<!-- Attestation Source -->
				<div class="mb-6">
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Attested by</p>
					<div class="flex items-center space-x-4">
						<!-- NVIDIA Logo -->
						<div class="flex items-center space-x-2">
							<img src="/assets/images/nvidia.svg" alt="NVIDIA" class="w-20 h-8" />
							<!-- <span class="text-gray-900 grey:text-white">and</span> -->
						</div>
						<!-- Intel Logo -->
						<div class="flex items-center space-x-2">
							<img src="/assets/images/intel.svg" alt="Intel" class="w-16 h-8" />
						</div>
					</div>
				</div>

				<!-- Description -->
				<p class="text-gray-700 dark:text-gray-300 mb-6">
					This automated verification tool lets you independently confirm that the model is running in the TEE (Trusted Execution Environment).
				</p>

				<!-- Related Links -->
				<!-- <div class="mb-6">
					<h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Related Links</h3>
					<div class="space-y-2">
						<a
							href="#"
							class="flex items-center text-red-500 hover:text-red-600 transition-colors"
						>
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
								<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
							</svg>
							How It Works
						</a>
						<a
							href="#"
							class="flex items-center text-red-500 hover:text-red-600 transition-colors"
						>
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
								<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
							</svg>
							Host LLM in TEE
						</a>
					</div>
				</div> -->

				<!-- Loading State -->
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span class="ml-3 text-gray-600 dark:text-gray-400">Verifying attestation...</span>
					</div>
				{:else if error}
					<!-- Error State -->
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
						<div class="flex items-center">
							<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
							</svg>
							<span class="text-red-800 dark:text-red-200">{error}</span>
						</div>
					</div>
				{:else if attestationData}
					<!-- Attestation Results -->
					<div class="space-y-4">
						<!-- GPU Attestation Section -->
						<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
							<button
								on:click={() => toggleSection('gpu')}
								class="w-full flex items-center justify-between text-left"
							>
								<div class="flex items-center space-x-3">
									<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
										<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
										</svg>
									</div>
									<span class="font-medium text-gray-900 dark:text-white">GPU Attestation</span>
								</div>
								<svg
									class="w-5 h-5 text-gray-400 transform transition-transform {expandedSections.gpu ? 'rotate-180' : ''}"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
							
							{#if expandedSections.gpu}
								<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600" transition:slide>
									<div class="space-y-3">
										{#if attestationData.nvidia_payload}
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
													NVIDIA Payload
												</label>
												<textarea
													readonly
													class="w-full h-24 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md resize-none"
												>{attestationData.nvidia_payload}</textarea>
											</div>
										{/if}
										{#if attestationData.signing_address}
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
													Signing Address
												</label>
												<input
													type="text"
													readonly
													value={attestationData.signing_address}
													class="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
												/>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<!-- TDX Attestation Section -->
						<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
							<button
								on:click={() => toggleSection('tdx')}
								class="w-full flex items-center justify-between text-left"
							>
								<div class="flex items-center space-x-3">
									<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
										<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
										</svg>
									</div>
									<span class="font-medium text-gray-900 dark:text-white">TDX Attestation</span>
								</div>
								<svg
									class="w-5 h-5 text-gray-400 transform transition-transform {expandedSections.tdx ? 'rotate-180' : ''}"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
							
							{#if expandedSections.tdx}
								<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600" transition:slide>
									<div class="space-y-3">
										{#if attestationData.intel_quote}
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
													Intel Quote
												</label>
												<textarea
													readonly
													class="w-full h-24 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md resize-none"
												>{attestationData.intel_quote}</textarea>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Verify Again Button -->
				{#if attestationData}
					<div class="mt-6 flex justify-center">
						<button
							on:click={verifyAgain}
							disabled={loading}
							class="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							<span>Verify Again</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
