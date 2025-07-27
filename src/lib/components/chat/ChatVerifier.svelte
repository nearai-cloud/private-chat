<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import ModelVerifier from './ModelVerifier.svelte';
	import MessagesVerifier from './MessagesVerifier.svelte';

	export let history: {
		messages: Record<string, any>,
		currentId: string | null;
	};
	export let token: string;
	export let selectedModels: string[];
	export let expanded = false;

	const dispatch = createEventDispatcher();

	let showModelVerifier = false;

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

<div class="relative">
	<!-- Toggle Button -->
	{#if !expanded}
		<button
			on:click={toggleVerifier}
			class="fixed right-3 top-12 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition-all duration-200"
			title="Toggle Verification Panel"
		>
			<svg
				class="w-4 h-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
		</button>
	{/if}

	<!-- Verifier Panel -->
	{#if expanded}
		<div
			class="fixed right-0 top-10 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-40"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white">AI Chat Verification</h2>
				<button
					on:click={toggleVerifier}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="h-full flex flex-col">
				<!-- Model Verification Section -->
				<div class="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
					<div class="p-4">
						<h2 class="text-md font-medium text-gray-900 dark:text-white mb-3">Model Verification</h2>
						
						<!-- Open Model Verifier Button -->
						<button
							on:click={openModelVerifier}
							disabled={!selectedModels[0]}
							class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
						>
							Verify Model
						</button>
					</div>
				</div>

				<!-- Messages Verification Section -->
				<div class="flex-1 overflow-hidden">
					<div class="h-full flex flex-col">
						<div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
							<h2 class="text-md font-medium text-gray-900 dark:text-white">Messages Verification</h2>
						</div>
						<div class="flex-1 overflow-y-auto">
							<MessagesVerifier {history} {token} />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Model Verifier Modal -->
	<ModelVerifier
		model={selectedModels[0]}
		{token}
		bind:show={showModelVerifier}
		on:close={closeModelVerifier}
	/>
</div>
