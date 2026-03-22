import type { PaginatedResponseDto, SortOrderDto } from "./common.dto";

export interface CreateAuthorDto {
  name: string;
  email: string;
  slug?: string;
  bio?: string;
  birthDate?: string;
  website?: string;
}

export type UpdateAuthorDto = Partial<CreateAuthorDto>;

export interface AuthorDto {
  id: string;
  name: string;
  slug: string;
  email: string;
  bio?: string;
  birthDate?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAuthorsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  order?: SortOrderDto;
}

export type ListAuthorsResponseDto = PaginatedResponseDto<AuthorDto>;
