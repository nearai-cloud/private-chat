<script lang="ts">
	import PDFViewer from '$lib/components/PDFViewer.svelte';

	const cookiePolicyUrl = '/cookie.pdf';
</script>

<div
	class="h-screen max-h-[100dvh] text-gray-700 overflow-scroll dark:text-gray-100 bg-white dark:bg-gray-900 w-full max-w-full flex flex-col"
>
	<PDFViewer pdfUrl={cookiePolicyUrl} />
</div>
