<script lang="ts">
	import Spinner from '$lib/components/common/Spinner.svelte';
</script>

<div class="flex items-center py-2 gap-x-2 text-xs">
	<!-- <div class="size-3.5 bg-[#00EC97] rounded-full animate-msg"></div> -->
	<Spinner className="size-4 text-[#00EC97]" />
	<span class="shimmer text-gray-500 dark:text-gray-500 text-base"
		>Encrypting & fetching messages ...</span
	>
</div>

<style>
	.animate-msg {
		animation: pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(0.8);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.2);
			opacity: 1;
		}
	}
</style>
