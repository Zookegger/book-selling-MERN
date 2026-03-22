import type { PaginatedResponseDto, SortOrderDto } from "./common.dto";

export interface CategoryReferenceDto {
  id: string;
  name: string;
  slug: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parent?: string | null;
  order?: number;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | CategoryReferenceDto | null;
  ancestors: Array<string | CategoryReferenceDto>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeItemDto extends CategoryDto {
  children?: CategoryTreeItemDto[];
}

export interface ListCategoriesQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  order?: SortOrderDto;
}

export type ListCategoriesResponseDto = PaginatedResponseDto<CategoryDto>;
