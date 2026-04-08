import type { AuthorDto } from "./author.dto";
import type { CategoryDto } from "./category.dto";
import type { PublisherDto } from "./publisher.dto";

export type BookFormatType = "physical" | "digital" | "audiobook";

export interface BookFormatDto {
  _id?: string;
  formatType: BookFormatType;
  sku: string;
  isbn?: string;
  price: number;
  discountedPrice?: number;
  currency?: string;
  active?: boolean;
  releaseDate?: string;
  stockQuantity?: number;
  weight?: number;
  dimensions?: string;
  file?: string;
  fileFormat?: "PDF" | "ePub" | "MOBI";
  fileSize?: number;
  downloadLimit?: number;
  sampleFile?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookDto {
  title: string;
  slug?: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  publicationDate: string;
  language?: string;
  pageCount?: number;
  publisher?: string;
  authors?: string[];
  categories?: string[];
  coverImage?: string;
  formats?: BookFormatDto[];
}

export type UpdateBookDto = Partial<CreateBookDto>;

export interface BookDto {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  publicationDate: string;
  language: string;
  pageCount?: number;
  publisher?: PublisherDto;
  authors: AuthorDto[];
  categories: CategoryDto[];
  coverImage?: string;
  formats: BookFormatDto[];
  createdAt: string;
  updatedAt: string;
}

export type AddBookFormatDto = BookFormatDto;
export type UpdateBookFormatDto = Partial<BookFormatDto>;

export interface ListBooksQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  category?: string;
  order?: "asc" | "desc";
}

export interface PaginatedBooksResponseDto {
  data: BookDto[];
  total: number;
  page: number;
  totalPages: number;
}
