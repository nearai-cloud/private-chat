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

	let verifyStatus: 'pending' | 'success' | 'error' = 'pending';

	const closeModal = () => {
		dispatch('close');
	};

	$: if (show && address && message && signature) {
		verifyStatus = 'pending';
		const isValid = verifySignature(address, message, signature);
		verifyStatus = isValid ? 'success' : 'error';
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		on:click={closeModal}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white dark:bg-gray-950 border dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div
				class="flex px-6 pt-6 pb-3 items-center justify-between border-gray-200 dark:border-gray-700"
			>
				<h2 class="text-lg text-gray-900 dark:text-white gap-2 flex items-center">
					Signature Verification
				</h2>
				<button
					on:click={closeModal}
					class="text-white shadow hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8 rounded flex items-center justify-center dark:bg-[rgba(248,248,248,0.04)] transition-colors"
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
						class="mb-4 py-2 px-2.5 text-green-700 dark:text-green-300 bg-green-50 dark:bg-[rgba(0,236,151,0.08)] border border-green-200 dark:border-[rgba(0,236,151,0.08)] rounded-lg text-sm"
					>
						<svg
							class="w-5 -mt-[2px] h-5 text-green-500 dark:text-[rgba(0,236,151,1)] mr-0.5 inline-block"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						Message Signature Verified. The message signature has been confirmed to be signed by the
						address using the
						<a
							class="text-blue-500 underline"
							href="https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm"
							rel="noopener noreferrer"
							target="_blank"
						>
							ECDSA
						</a>
						algorithm.
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
						<div
							class="mb-2 text-black dark:text-[rgba(161,161,161,1)] text-sm flex items-center justify-between"
						>
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
								class="w-full placeholder:text-[rgba(161,161,161,1)] dark:text-[rgba(161,161,161,1)] text-sm outline-hidden py-2 px-3 border rounded border-gray-300/50 dark:border-[rgba(248,248,248,0.08)] dark:bg-[rgba(248,248,248,0.04)]"
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
						<div
							class="mb-2 text-black dark:text-[rgba(161,161,161,1)] text-sm flex items-center justify-between"
						>
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
								class="w-full placeholder:text-[rgba(161,161,161,1)] dark:text-[rgba(161,161,161,1)] text-sm outline-hidden py-2 px-3 border rounded border-gray-300/50 dark:border-[rgba(248,248,248,0.08)] dark:bg-[rgba(248,248,248,0.04)]"
								rows="3"
								required
								value={message}
								disabled
								maxlength="60000"
							/>
						</div>
					</div>
					<div class="flex flex-col w-full mb-6">
						<div
							class="mb-2 text-black dark:text-[rgba(161,161,161,1)] text-sm flex items-center justify-between"
						>
							<span>Signature</span>
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
								class="w-full dark:text-[rgba(161,161,161,1)] placeholder:text-[rgba(161,161,161,1)] text-smoutline-hidden py-2 px-3 border rounded border-gray-300/50 dark:border-[rgba(248,248,248,0.08)] dark:bg-[rgba(248,248,248,0.04)]"
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
