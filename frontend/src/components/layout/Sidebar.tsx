import React from 'react';

import { useUserStore } from '../../stores/useUserStore';
import UserIcon from '@/assets/icons/user-icon.png';
import NearAIIcon from '@/assets/icons/near-icon-green.svg?react';
import CloseIcon from '@/assets/icons/close-icon.svg?react';
import PencilIcon from '@/assets/icons/pencil-icon.svg?react';
import { useViewStore } from '@/stores/useViewStore';

const Sidebar: React.FC = () => {
	const { isLeftSidebarOpen } = useViewStore();
	const { user } = useUserStore();

	return (
		<nav className="shrink-0 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-200 text-sm fixed z-50 top-0 left-0 overflow-x-hidden transition-width duration-200 ease-in-out">
			<div
				id="sidebar"
				className={`h-screen max-h-[100dvh] min-h-screen select-none ${
					isLeftSidebarOpen ? 'md:relative w-[260px] max-w-[260px]' : '-translate-x-[260px] w-[0px]'
				}'transition-width duration-200 ease-in-out shrink-0 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-200 text-sm fixed z-50 top-0 left-0 overflow-x-hidden
        `}
			>
				<div
					className={`py-2 my-auto flex flex-col justify-between h-screen max-h-[100dvh] w-[260px] overflow-x-hidden z-50 ${
						isLeftSidebarOpen ? '' : 'invisible'
					}`}
				>
					{/* Top section */}
					<div className="flex flex-col items-center justify-between my-4 px-4 gap-4">
						<div className="flex w-full justify-between">
							<button
								type="button"
								className="h-8 w-8 cursor-pointer shadow rounded flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-850 dark:bg-[rgba(248,248,248,0.04)]"
							>
								<NearAIIcon />
							</button>
							<button
								type="button"
								className="text-white shadow hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 h-8 w-8 rounded flex items-center justify-center dark:bg-[rgba(248,248,248,0.04)] transition-colors"
							>
								<CloseIcon />
							</button>
						</div>
						<div className="w-full">
							<div className="flex justify-center mb-5 space-x-1 text-gray-600 dark:text-white h-9 items-center">
								<a
									id="sidebar-new-chat-button"
									className="flex justify-center items-center flex-1 gap-x-2 rounded-lg px-2 py-1 h-full text-right transition no-drag-region dark:bg-[#F8F8F80A] hover:bg-gray-50 dark:hover:bg-gray-850"
									href="/"
									draggable="false"
								>
									<div className="flex items-center">
										<div className=" self-center font-medium text-sm font-primary">
											{'New Chat'}
										</div>
									</div>
									<div>
										<PencilIcon stroke={'#000'} />
									</div>
								</a>
							</div>
						</div>
					</div>

					{/* Bottom section */}
					<div className="px-2">
						<button className="flex items-center rounded-xl py-2.5 px-2.5 w-full transition">
							<div className="self-center mr-3">
								<img
									src={UserIcon}
									alt="User"
									className="w-8 h-8 max-w-[30px] object-cover rounded-full"
								/>
							</div>
							<div className="self-center font-medium">{user?.name}</div>
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Sidebar;
