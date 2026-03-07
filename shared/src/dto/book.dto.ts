export type BookFormatType = "physical" | "digital" | "audiobook";

export interface BookFormatDto {
  formatType: BookFormatType;
  sku: string;
  isbn?: string;
  price: number;
  discountedPrice?: number;
  currency: string;
  active: boolean;
  releaseDate?: string;
  stockQuantity?: number;
  weight?: number;
  dimensions?: string;
  file?: string;
  fileFormat?: "PDF" | "ePub" | "MOBI";
  fileSize?: number;
  downloadLimit?: number;
  sampleFile?: string;
}

export interface CreateBookDto {
  title: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  publicationDate: string;
  language: string;
  pageCount?: number;
  publisher?: string;
  authors: string[];
  categories: string[];
  coverImage?: string;
  formats: BookFormatDto[];
}

export type UpdateBookDto = Partial<CreateBookDto>;

export interface BookDto {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  publicationDate: string;
  language: string;
  pageCount?: number;
  publisher?: string;
  authors: string[];
  categories: string[];
  coverImage?: string;
  formats: BookFormatDto[];
  createdAt: string;
  updatedAt: string;
}
