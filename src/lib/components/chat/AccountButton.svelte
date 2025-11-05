<script lang="ts">
	import UserMenu from '$lib/components/layout/Sidebar/UserMenu.svelte';
	import { user, showArchivedChats } from '$lib/stores';

	export let buttonClass: string = '';
	export let iconClass: string = '';
</script>

{#if $user !== undefined && $user !== null}
	<UserMenu
		className="max-w-[200px]"
		role={$user?.role}
		on:show={(e) => {
			if (e.detail === 'archived-chat') {
				showArchivedChats.set(true);
			}
		}}
	>
		<button
			class="select-none flex rounded-xl p-1.5 w-full hover:bg-gray-50 dark:hover:bg-gray-850 transition {buttonClass}"
			aria-label="User Menu"
		>
			<div class="self-center">
				<img
					src={$user?.profile_image_url}
					class="size-6 object-cover rounded-full {iconClass}"
					alt="User profile"
					draggable="false"
				/>
			</div>
		</button>
	</UserMenu>
{/if}
