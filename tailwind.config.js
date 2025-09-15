import typography from '@tailwindcss/typography';
import containerQuries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				gray: {
					50: 'var(--color-gray-50, #f9f9f9)',
					100: 'var(--color-gray-100, #ececec)',
					200: 'var(--color-gray-200, #e3e3e3)',
					300: 'var(--color-gray-300, #f8f8f8)',
					400: 'var(--color-gray-400, #A1A1A1)',
					500: 'var(--color-gray-500, #9b9b9b)',
					600: 'var(--color-gray-600, #676767)',
					700: 'var(--color-gray-700, #4e4e4e)',
					750: 'var(--color-gray-750, rgba(248,248,248,0.08))',
					800: 'var(--color-gray-800, #333)',
					850: 'var(--color-gray-850, #262626)',
					875: 'var(--color-gray-875, #151515)',
					900: 'var(--color-gray-900, #090909)',
					950: 'var(--color-gray-950, rgba(9, 9, 9, 1))'
				},
				nearg: {
					400: 'var(--color-nearg-400, rgba(0, 236, 151, 1))',
					500: 'var(--color-nearg-500, rgba(0, 236, 151, 0.08))'
				}
			},
			typography: {
				DEFAULT: {
					css: {
						pre: false,
						code: false,
						'pre code': false,
						'code::before': false,
						'code::after': false
					}
				}
			},
			padding: {
				'safe-bottom': 'env(safe-area-inset-bottom)'
			}
		}
	},
	plugins: [typography, containerQuries]
};
