import type { PaginatedResponseDto, SortOrderDto } from "./common.dto";

export interface PublisherLocationDto {
  address?: string;
  city?: string;
  country?: string;
}

export interface CreatePublisherDto {
  name: string;
  slug?: string;
  description?: string;
  location?: PublisherLocationDto;
  contactEmail?: string;
  website?: string;
  logo?: string;
  isActive?: boolean;
}

export type UpdatePublisherDto = Partial<CreatePublisherDto>;

export interface PublisherDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: PublisherLocationDto;
  contactEmail: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListPublishersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  order?: SortOrderDto;
}

export type ListPublishersResponseDto = PaginatedResponseDto<PublisherDto>;
