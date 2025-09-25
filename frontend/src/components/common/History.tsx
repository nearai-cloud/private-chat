import React from 'react';

interface HistoryItem {
	id: string;
	title: string;
	active?: boolean;
}

interface HistoryProps {
	items: HistoryItem[];
	onSelect?: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ items, onSelect }) => {
	return (
		<div className="flex-1 overflow-y-auto px-2.5 pb-3">
			<div className="space-y-1">
				{items.map((item) => (
					<button
						key={item.id}
						onClick={() => onSelect?.(item.id)}
						className={`w-full text-left flex items-center rounded-xl py-2.5 px-2.5 hover:bg-gray-100 dark:hover:bg-gray-900 transition ${
							item.active ? 'bg-gray-100 dark:bg-gray-900' : ''
						}`}
					>
						<div className="flex items-center space-x-2 w-full min-w-0">
							<svg
								className="w-4 h-4 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
							<div className="text-sm truncate">{item.title}</div>
						</div>
					</button>
				))}
			</div>
		</div>
	);
};

export default History;
