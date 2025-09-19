export function stripHtmlTags(html: string | null | undefined): string {
	try {
		if (!html || typeof html !== 'string') return '';

		let text = html.replace(/<[^>]*>?/gm, '');
		const htmlEntities: Record<string, string> = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#39;': "'",
			'&#039;': "'",
			'&nbsp;': ' ',
			'&#160;': ' '
		};

		text = text.replace(
			new RegExp(Object.keys(htmlEntities).join('|'), 'g'),
			(match) => htmlEntities[match] || match
		);
		return text.trim().replace(/\s+/g, ' ');
	} catch (err) {
		console.error('Error stripping HTML tags:', err);
		return html || '';
	}
}
