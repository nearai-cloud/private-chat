/**
 * Removes the "phala/" prefix from model names for display purposes
 * @param modelName - The model name that may contain the phala/ prefix
 * @returns The model name without the phala/ prefix, or the original name if no prefix exists
 */
export const removeModelPrefix = (modelName: string): string => {
	if (modelName && modelName.startsWith('phala/')) {
		return modelName.substring(6); // Remove 'phala/' (6 characters)
	}
	return modelName;
};
