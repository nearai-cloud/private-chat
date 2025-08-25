<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { copyToClipboard } from '$lib/utils';
	import { verifySignature } from '$lib/utils/signature';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import ClipboardIcon from '$lib/components/icons/Clipboard.svelte';

	const dispatch = createEventDispatcher();

	export let show = false;
	export let address = '';
	export let message = '';
	export let signature = '';
	export let algorithm = '';

	let showSignatureVerificationDialog = false;
	let verifyStatus: 'pending' | 'success' | 'error' = 'pending';

	const closeModal = () => {
		showSignatureVerificationDialog = false;
		dispatch('close');
	};
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		on:click={closeModal}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Verify Signature</h2>
				<button
					on:click={closeModal}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			<div class="px-6 pt-4 pb-6">
				<!-- Model Info -->
				<form
					class="flex flex-col w-full"
					on:submit={(e) => {
						e.preventDefault();
						verifyStatus = 'pending';
						const isValid = verifySignature(address, message, signature);
						verifyStatus = isValid ? 'success' : 'error';
						showSignatureVerificationDialog = true;
					}}
				>
					<div class="flex flex-col w-full mb-3">
						<div class="mb-2 text-black text-sm">Address</div>
						<div class="flex-1">
							<input
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								type="text"
								autocomplete="off"
								value={address}
								placeholder="0x..."
								disabled
								required
							/>
						</div>
					</div>
					<div class="flex flex-col w-full mb-3">
						<div class="mb-2 text-black text-sm">Message</div>
						<div class="flex-1">
							<textarea
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								rows="3"
								required
								value={message}
								disabled
								maxlength="60000"
							/>
						</div>
					</div>
					<div class="flex flex-col w-full mb-6">
						<div class="mb-2 text-black text-sm">Signature Hash</div>
						<div class="flex-1">
							<input
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								type="text"
								autocomplete="off"
								value={signature}
								disabled
								required
							/>
						</div>
					</div>
					<div class="flex w-full justify-end items-center">
						<button
							class="px-4 py-2 text-sm mr-4 font-medium bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition rounded-lg"
							type="button"
							on:click={closeModal}
						>
							Cancel
						</button>
						<button
							class="px-4 py-2 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-lg"
							type="submit"
						>
							Continue
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

{#if showSignatureVerificationDialog}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		on:click={closeModal}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Signature Verification</h2>
				<button
					on:click={closeModal}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			<div class="px-6 pt-4 pb-6">
				<!-- Status -->
				{#if verifyStatus === 'success'}
					<div
						class="flex items-center gap-2 mb-4 py-2 px-2.5 text-[#00a186] bg-[#ccf4ed] border border-[#ccf4ed] rounded-lg text-sm"
					>
						<CheckIcon />
						Message Signature Verified.
					</div>
				{/if}
				{#if verifyStatus === 'error'}
					<div
						class="flex items-center gap-2 mb-4 py-2 px-2.5 text-[#b02a37] bg-[#f8d7da] border border-[#f1aeb5] rounded-lg text-sm"
					>
						Sorry! The Message Signature Verification Failed
					</div>
				{/if}

				<!-- Model Info -->
				<form
					class="flex flex-col w-full"
					on:submit={(e) => {
						e.preventDefault();
					}}
				>
					<div class="flex flex-col w-full mb-3">
						<div class="mb-2 text-black text-sm flex items-center justify-between">
							<span>Address</span>
							<button
								class="flex items-center gap-x-1 bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md px-2 py-1"
								on:click={() => {
									copyToClipboard(address);
								}}
							>
								<ClipboardIcon /> Copy
							</button>
						</div>
						<div class="flex-1">
							<input
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								type="text"
								autocomplete="off"
								value={address}
								placeholder="0x..."
								disabled
								required
							/>
						</div>
					</div>
					<div class="flex flex-col w-full mb-3">
						<div class="mb-2 text-black text-sm flex items-center justify-between">
							<span>Message</span>
							<button
								class="flex items-center gap-x-1 bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md px-2 py-1"
								on:click={() => {
									copyToClipboard(message);
								}}
							>
								<ClipboardIcon /> Copy
							</button>
						</div>
						<div class="flex-1">
							<textarea
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								rows="3"
								required
								value={message}
								disabled
								maxlength="60000"
							/>
						</div>
					</div>
					<div class="flex flex-col w-full mb-6">
						<div class="mb-2 text-black text-sm flex items-center justify-between">
							<span>Hash</span>
							<button
								class="flex items-center gap-x-1 bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md px-2 py-1"
								on:click={() => {
									copyToClipboard(signature);
								}}
							>
								<ClipboardIcon /> Copy
							</button>
						</div>
						<div class="flex-1">
							<textarea
								class="w-full placeholder:text-gray-300 text-sm dark:placeholder:text-gray-700 outline-hidden py-2 px-3 border rounded border-gray-300/50"
								value={signature}
								rows="3"
								required
								disabled
								maxlength="60000"
							/>
						</div>
					</div>
					<div class="flex w-full justify-end items-center">
						<button
							class="px-4 py-2 text-sm font-medium bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition rounded-lg"
							type="button"
							on:click={closeModal}
						>
							Close
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
