import React from 'react';

interface RightSidebarProps {
	show: boolean;
	width?: string;
	onClose?: () => void;
	className?: string;
	children?: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
	show,
	width = '320px',
	onClose,
	className = '',
	children
}) => {
	if (!show) return null;

	return (
		<div className="absolute z-20 top-0 right-0 left-0 bottom-0 w-full min-h-full h-full flex justify-center overflow-hidden overscroll-contain">
			{/* Backdrop */}
			<div
				className="absolute z-20 top-0 right-0 left-0 bottom-0 bg-white/20 dark:bg-black/5 w-full"
				onMouseDown={onClose}
			/>

			{/* Panel */}
			<div className="absolute z-30 shadow-xl right-0 top-0 bottom-0">
				<div className={`h-full ${className}`} style={{ width }}>
					{children}
				</div>
			</div>
		</div>
	);
};

export default RightSidebar;
