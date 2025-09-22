<script lang="ts">
	import { getMessageSignature, type MessageSignature } from '$lib/apis/nearai';
	import { messagesSignatures } from '$lib/stores';
	import VerifySignatureDialog from './VerifySignatureDialog.svelte';
	import type { Message } from '$lib/types';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import RefreshIcon from '$lib/components/icons/Refresh.svelte';

	export let history: {
		messages: Record<string, Message>;
		currentId: string | null;
	};
	export let token: string;
	export let chatId = null;

	let loadingSignatures: Set<string> = new Set();
	let errorSignatures = {};
	let error: string | null = null;
	let selectedMessageId = '';
	let lastCurrentId = '';
	let containerElement: HTMLElement | undefined;

	let showVerifySignatureDialog = false;
	let selectedSignature: MessageSignature | null = null;
	let viewMore = false;

	// Get verifiable messages from history
	const getChatCompletions = (history: {
		messages: Record<string, Message>;
		currentId: string | null;
	}) => {
		if (!history?.messages) return [];
		return Object.values(history.messages).filter(
			(message) => message.role === 'assistant' && message.done === true
		);
	};

	// Reactive statement to calculate chatCompletions when history changes
	$: chatCompletions = history ? getChatCompletions(history) : [];

	// Set default selection to current message when component loads or history changes
	$: if (history?.currentId && history.messages[history.currentId]?.chatCompletionId) {
		// Auto-select only if this is a new message (currentId changed) or if no message is selected
		if (history.currentId !== lastCurrentId || !selectedMessageId) {
			selectedMessageId = history.messages[history.currentId].chatCompletionId!;
		}
		lastCurrentId = history.currentId;
	}

	// Scroll to selected message when selectedMessageId changes
	$: if (selectedMessageId && containerElement) {
		scrollToSelectedMessage();
	}

	$: messageList = viewMore ? chatCompletions : chatCompletions.slice(0, 2);

	// Function to fetch message signature
	const fetchMessageSignature = async (msgId) => {
		if (!token || !history || !chatCompletions.length || !msgId) return;
		const msg = chatCompletions.find((message) => message.chatCompletionId === msgId);
		if (!msg || !msg.chatCompletionId || $messagesSignatures[msg.chatCompletionId]) return;
		if (loadingSignatures.has(msg.chatCompletionId)) return;

		loadingSignatures.add(msg.chatCompletionId);
		loadingSignatures = loadingSignatures; // Trigger reactivity

		try {
			const data = await getMessageSignature({
				token,
				model: msg.model,
				chatCompletionId: msg.chatCompletionId
			});
			if (!data || !data.signature) {
				const errorMsg =
					data?.detail || data?.message || 'No signature data found for this message';
				errorSignatures[msg.chatCompletionId] = errorMsg;
				return;
			}
			messagesSignatures.update((prev) => ({ ...prev, [msg.chatCompletionId]: data }));
			delete errorSignatures[msg.chatCompletionId];
		} catch (err) {
			console.error('Error fetching message signature:', err);
			const errorMsg = err instanceof Error ? err.message : 'Failed to fetch message signature';
			errorSignatures[msg.chatCompletionId] = errorMsg;
		} finally {
			loadingSignatures.delete(msg.chatCompletionId);
			loadingSignatures = loadingSignatures;
		}
	};

	// Function to scroll to selected message
	const scrollToSelectedMessage = () => {
		if (!containerElement || !selectedMessageId) return;

		// Use a longer delay to ensure DOM is fully updated and signatures are loaded
		setTimeout(() => {
			const selectedElement = containerElement?.querySelector(
				`[data-message-id="${selectedMessageId}"]`
			) as HTMLElement;
			if (selectedElement) {
				// Find the parent scroll container
				const scrollContainer = selectedElement.closest('.overflow-y-auto') as HTMLElement;
				if (scrollContainer) {
					// Calculate the scroll position to center the element
					const containerRect = scrollContainer.getBoundingClientRect();
					const elementRect = selectedElement.getBoundingClientRect();
					const scrollTop =
						selectedElement.offsetTop -
						scrollContainer.offsetTop -
						containerRect.height / 2 +
						elementRect.height / 2;

					scrollContainer.scrollTo({
						top: scrollTop,
						behavior: 'smooth'
					});
				} else {
					// Fallback to scrollIntoView
					selectedElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
						inline: 'nearest'
					});
				}
			} else {
				console.log('Could not find element with data-message-id:', selectedMessageId);
			}
		}, 300); // Increased delay to ensure DOM is updated
	};

	const openVerifySignatureDialog = () => {
		if (!$messagesSignatures[selectedMessageId]) return;
		if (!$messagesSignatures[selectedMessageId].signature) return;
		showVerifySignatureDialog = true;
		selectedSignature = $messagesSignatures[selectedMessageId];
	};

	const closeVerifySignatureDialog = () => {
		showVerifySignatureDialog = false;
		selectedSignature = null;
	};

	$: {
		chatId;
		selectedMessageId = '';
	}

	$: if (selectedMessageId) {
		fetchMessageSignature(selectedMessageId);
	}
</script>

<div class="space-y-4 h-full overflow-y-auto pb-4 px-4" bind:this={containerElement}>
	{#if error}
		<!-- Error State -->
		<div
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="text-red-800 dark:text-red-200">{error}</span>
			</div>
		</div>
	{:else if chatCompletions.length > 0}
		<!-- Verifiable Messages Section -->
		<div class="space-y-4">
			<h3 class="text-xs mt-4 text-gray-900 uppercase dark:text-[rgba(161,161,161,1)]">
				Verifiable Messages ({chatCompletions.length})
			</h3>

			{#each messageList as message, index}
				<div
					class="bg-green-50 text-xs dark:bg-[rgba(0,236,151,0.08)] border border-green-200 dark:border-[rgba(0,236,151,0.16)] rounded-lg my-2 p-2 relative cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors {selectedMessageId ===
					message.chatCompletionId
						? 'ring-1 ring-green-700 dark:bg-[rgba(0,236,151,0.15)]!'
						: ''}"
					on:click={() =>
						message.chatCompletionId && (selectedMessageId = message.chatCompletionId)}
					title="Click to view signature details"
					data-message-id={message.chatCompletionId}
				>
					<!-- Message Content -->
					<div class="mb-3">
						<h4
							class="text-sm font-medium text-gray-900 flex items-center justify-between dark:text-white mb-3"
						>
							<span>Message {index + 1}</span>
							<div class="flex items-center space-x-1">
								<img src="/assets/images/verified.svg" />
							</div>
						</h4>
						<p
							class="text-xs text-gray-700 dark:text-[rgba(248,248,248,0.88)] mb-2 line-clamp-2 {selectedMessageId ===
							message.chatCompletionId
								? 'dark:text-white!'
								: ''}"
						>
							{message.content}
						</p>
						<p class="text-xs text-gray-500 dark:text-rgba(248,248,248,0.64)">
							ID: {message.chatCompletionId}
						</p>
					</div>
				</div>
			{/each}

			{#if chatCompletions.length > 2}
				<button
					class="w-full flex items-center justify-center px-4 py-2 bg-gray-100 gap-2.5 hover:bg-gray-200 dark:bg-[rgba(248,248,248,0.08)] text-gray-700 dark:text-white text-sm rounded-md transition-colors"
					on:click={() => (viewMore = !viewMore)}
				>
					{#if viewMore}View Less{:else}View More{/if}
					<ChevronDown className="size-4 {viewMore ? 'rotate-180' : ''}" strokeWidth="2.5" />
				</button>
			{/if}

			<!-- Signature Details Section -->
			<div class="space-y-3">
				<div class="flex justify-between items-center">
					<h3 class="text-xs text-gray-900 uppercase dark:text-[rgba(161,161,161,1)] mt-4">
						Signature Details
					</h3>
				</div>

				{#if selectedMessageId && $messagesSignatures[selectedMessageId]}
					<!-- Verify on ECDSA Signature modal -->
					{#if $messagesSignatures[selectedMessageId].signature}
						<button
							class="flex items-center text-green-500 hover:text-green-700 text-xs transition-colors mb-4"
							on:click={openVerifySignatureDialog}
						>
							<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
							Verify the ECDSA Signature
						</button>
					{/if}

					<div class="rounded-lg min-h-[150px]">
						<!-- Signing Address -->
						<div class="mb-2">
							<label class="block text-xs text-gray-700 dark:text-[rgba(161,161,161,1)] mb-1"
								>Signing Address:</label
							>
							<div
								class="px-2 py-1 bg-gray-100 dark:bg-[rgba(248,248,248,0.04)] border border-gray-300 dark:border-[rgba(248,248,248,0.08)] rounded text-xs font-mono break-all min-h-[24px] flex items-center"
							>
								{$messagesSignatures[selectedMessageId].signing_address ?? ''}
							</div>
						</div>

						<!-- Message Hash -->
						<div class="mb-2">
							<label class="block text-xs text-gray-700 dark:text-[rgba(161,161,161,1)] mb-1"
								>Message:</label
							>
							<div
								class="px-2 py-1 bg-gray-100 dark:bg-[rgba(248,248,248,0.04)] border border-gray-300 dark:border-[rgba(248,248,248,0.08)] rounded text-xs font-mono break-all min-h-[24px] flex items-center"
							>
								{$messagesSignatures[selectedMessageId].text ?? ''}
							</div>
						</div>

						<!-- Signature -->
						<div class="mb-2">
							<label class="block text-xs text-gray-700 dark:text-[rgba(161,161,161,1)] mb-1"
								>Signature:</label
							>
							<div
								class="px-2 py-1 bg-gray-100 dark:bg-[rgba(248,248,248,0.04)] border border-gray-300 dark:border-[rgba(248,248,248,0.08)] rounded text-xs font-mono break-all min-h-[24px] flex items-center"
							>
								{$messagesSignatures[selectedMessageId].signature ?? ''}
							</div>
						</div>

						<!-- Algorithm -->
						<div>
							<label class="block text-xs text-gray-700 dark:text-[rgba(161,161,161,1)] mb-1"
								>Algorithm:</label
							>
							<div
								class="px-2 py-1 bg-gray-100 dark:bg-[rgba(248,248,248,0.04)] border border-gray-300 dark:border-[rgba(248,248,248,0.08)] rounded text-xs min-h-[24px] flex items-center"
							>
								{$messagesSignatures[selectedMessageId].signing_algo ?? ''}
							</div>
						</div>
					</div>
				{:else if selectedMessageId}
					{#if loadingSignatures.has(selectedMessageId)}
						<!-- Loading State -->
						<div class="rounded-lg min-h-[150px] flex items-center justify-center">
							<Spinner className="size-4 text-nearg-400" />
						</div>
					{:else if errorSignatures[selectedMessageId]}
						<!-- Error State -->
						<div class="rounded-lg min-h-[150px] flex items-center justify-center">
							<div class="text-center py-2 text-gray-500 dark:text-gray-400">
								<p class="text-xs">No signature data found for this message.</p>
							</div>
							<!-- retry -->
							<button
								title="Retry"
								type="button"
								class="hover:opacity-75 ml-1 cursor-pointer"
								on:click={() => fetchMessageSignature(selectedMessageId)}
							>
								<RefreshIcon className="size-3.5 text-nearg-400" />
							</button>
						</div>
					{:else}
						<!-- No Signature Found State -->
						<div class="rounded-lg min-h-[150px] flex items-center justify-center">
							<div class="text-center py-2 text-gray-500 dark:text-gray-400">
								<p class="text-xs">No signature data found for this message.</p>
							</div>
						</div>
					{/if}
				{:else}
					<div class="rounded-lg min-h-[150px] flex items-center justify-center">
						<div class="text-center py-2 text-gray-500 dark:text-gray-400">
							<p class="text-xs">Click on a message above to view signature details</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- No Data State -->
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			<p class="text-sm">No verifiable messages found for this chat.</p>
		</div>
	{/if}

	<!-- Add bottom padding for better scrolling -->
	<div class="h-10"></div>

	<VerifySignatureDialog
		bind:show={showVerifySignatureDialog}
		on:close={closeVerifySignatureDialog}
		address={selectedSignature?.signing_address ?? ''}
		message={selectedSignature?.text ?? ''}
		signature={selectedSignature?.signature ?? ''}
		algorithm={selectedSignature?.signing_algo ?? ''}
	/>
</div>
