export type SortOrderDto = "asc" | "desc";

export interface MessageResponseDto {
	message: string;
}

export type ErrorStatusDto = "fail" | "error";

export interface ErrorResponseDto {
	status: ErrorStatusDto;
	message: string;
	data: any;
}

export interface PaginatedResponseDto<T> {
	data: T[];
	total: number;
	page: number;
	totalPages: number;
}
