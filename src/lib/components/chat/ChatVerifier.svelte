<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ModelVerifier from './ModelVerifier.svelte';
	import MessagesVerifier from './MessagesVerifier.svelte';
	import type { Message } from '$lib/types';

	export let history: {
		messages: Record<string, Message>;
		currentId: string | null;
	};
	export let token: string;
	export let selectedModels: string[];
	export let expanded = false;

	const dispatch = createEventDispatcher();

	let showModelVerifier = false;
	let modelVerificationStatus: any = null;

	// Function to toggle the verifier panel
	const toggleVerifier = () => {
		expanded = !expanded;
		dispatch('toggle', { expanded });
	};

	// Function to open model verifier
	const openModelVerifier = () => {
		showModelVerifier = true;
	};

	// Function to close model verifier
	const closeModelVerifier = () => {
		showModelVerifier = false;
	};
</script>

<div class="relative z-50">
	<!-- Toggle Button -->
	<!-- {#if !expanded}
		<button
			on:click={toggleVerifier}
			class="fixed right-3 top-12 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200"
			title="Toggle Verification Panel"
		>
			<img alt="safe" src="/assets/images/safe.svg" class="w-8 h-8" />
		</button>
	{/if} -->

	<!-- Verifier Panel -->
	<!-- class="fixed right-0 top-10 bottom-0 w-80 bg-white dark:bg-gray-875 shadow-xl border-l border-gray-200 dark:border-[rgba(255,255,255,0.04)] z-40" -->
	<div
		id="chat-verifier-sidebar"
		class="h-screen max-h-[100dvh] min-h-screen select-none
		transition-width duration-200 ease-in-out'} shrink-0 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-200 text-sm fixed z-50 top-0 right-0 overflow-x-hidden
			{expanded ? 'md:relative w-[320px] max-w-[320px]' : 'translate-x-[320px] w-[0px]'}
			"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 mt-2">
			<h2 class="text-base text-gray-900 dark:text-white gap-2 flex items-center">
				<img alt="safe" src="/assets/images/safe.svg" class="w-6 h-6" />
				AI Chat Verification
			</h2>
			<button
				on:click={toggleVerifier}
				class="text-white shadow hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8 rounded flex items-center justify-center dark:bg-[rgba(248,248,248,0.04)] transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="h-full flex flex-col">
			<!-- Model Verification Section -->
			<div class="flex-shrink-0 dark:border-gray-700">
				<div class="p-4">
					<h2
						class="text-base font-semibold text-gray-900 flex rounded items-center pl-4 dark:text-gray-300 h-8 mb-3"
					>
						Model Verification
					</h2>

					<!-- Hidden ModelVerifier for automatic verification -->
					<ModelVerifier
						model={selectedModels[0]}
						{token}
						show={false}
						autoVerify={expanded && !!selectedModels[0]}
						on:statusUpdate={(e) => (modelVerificationStatus = e.detail)}
					/>

					{#if modelVerificationStatus?.loading}
						<!-- Loading State -->
						<div class="flex items-center justify-center py-4">
							<div
								class="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgba(0,236,151,1)]"
							></div>
							<span class="ml-3 text-sm text-gray-600 dark:text-gray-400"
								>Verifying confidentiality...</span
							>
						</div>
					{:else if modelVerificationStatus?.error}
						<!-- Error State -->
						<div
							class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3"
						>
							<div class="flex items-center">
								<svg class="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="text-red-800 dark:text-red-200 text-sm"
									>{modelVerificationStatus.error}</span
								>
							</div>
						</div>
						<button
							on:click={() => (modelVerificationStatus = null)}
							disabled={!selectedModels[0]}
							class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
						>
							Retry Verification
						</button>
					{:else if modelVerificationStatus?.isVerified}
						<!-- Success State -->
						<div
							class="bg-green-50 dark:bg-[rgba(0,236,151,0.08)] border border-green-200 dark:border-[rgba(0,236,151,0.08)] rounded-lg p-3 mb-3"
						>
							<div class="flex items-center mb-2">
								<svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="text-green-700 dark:text-[rgba(0,236,151,1)] text-sm font-medium">
									Your chat is confidential.</span
								>
							</div>

							<!-- Attestation Sponsors -->
							<div class="mb-2">
								<p class="text-xs text-gray-600 dark:text-[rgba(248,248,248,0.64)] mb-2">
									Attested by
								</p>
								<div class="flex items-center space-x-4">
									<!-- NVIDIA Logo -->
									<div class="flex space-x-2">
										<img src="/assets/images/nvidia-2.svg" alt="NVIDIA" class="w-16 h-6" />
									</div>
									<span class="text-[rgba(248,248,248,0.64)] text-xs">and</span>
									<!-- Intel Logo -->
									<div class="flex space-x-2">
										<img src="/assets/images/intel-2.svg" alt="Intel" class="w-12 h-6" />
									</div>
								</div>
							</div>

							<!-- Description -->
							<p style="line-height: 1.5em" class="text-xs text-gray-600 dark:text-gray-400">
								This automated verification tool lets you independently confirm that the model is
								running in the TEE (Trusted Execution Environment).
							</p>
						</div>

						<!-- View Details Button -->
						<button
							on:click={openModelVerifier}
							class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[rgba(248,248,248,0.08)] text-gray-700 dark:text-white text-sm rounded-md transition-colors"
						>
							View Verification Details
						</button>
					{:else}
						<!-- No Data State -->
						<div class="flex items-center justify-center py-4">
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
							<span class="ml-3 text-sm text-gray-600 dark:text-gray-400"
								>Verifying confidentiality...</span
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Messages Verification Section -->
			<div class="flex-1 overflow-hidden">
				<div class="h-full flex flex-col">
					<div class="flex-shrink-0">
						<h2
							class="text-base font-semibold text-gray-900 flex rounded items-center pl-4 dark:text-gray-300 h-8"
						>
							Messages Verification
						</h2>
					</div>
					<div class="flex-1 overflow-y-auto">
						<MessagesVerifier {history} {token} />
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Model Verifier Modal -->
	<ModelVerifier
		model={selectedModels[0]}
		{token}
		bind:show={showModelVerifier}
		on:close={closeModelVerifier}
	/>
</div>
