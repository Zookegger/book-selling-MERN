export function getPagination(query: { page?: number; limit?: number }): {
	page: number;
	limit: number;
	skip: number;
} {
	// Default to page 1. `limit === Infinity` means "no limit" (return all),
	// which is convenient for some callers but can be heavy for large datasets.
	const page = query.page || 1;
	const limit = query.limit || Infinity; // Consider replacing Infinity with a limit like 10 because it could cause performance issues with large datasets
	const skip = (page - 1) * limit;

	return { page, limit, skip };
}
