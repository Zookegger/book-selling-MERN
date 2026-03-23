import type { BookFormatType } from "./book.dto";
import type { MessageResponseDto } from "./common.dto";

export type UserRoleDto = "customer" | "admin";

export interface AddressDto {
  recipientName: string;
  phoneNumber: string;
  provinceOrCity: string;
  district: string;
  ward: string;
  streetDetails: string;
  country: string;
  isDefault: boolean;
}

export type AddAddressRequestDto = Omit<AddressDto, "isDefault"> & {
  isDefault?: boolean;
};

export type UpdateAddressRequestDto = Partial<AddressDto>;

export interface WishlistItemDto {
  book: string | Record<string, unknown>;
  addedAt: string;
  desiredFormat?: BookFormatType;
}

export interface DigitalLibraryItemDto {
  book: string | Record<string, unknown>;
  formatIndex?: number;
  purchasedAt: string;
}

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRoleDto;
  isEmailVerified: boolean;
  addresses: AddressDto[];
  wishList: WishlistItemDto[];
  digitalLibrary: DigitalLibraryItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequestDto {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	addresses?: AddressDto[];
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type GetProfileResponseDto = UserDto;
export type UpdateProfileResponseDto = UserDto;
export type ChangePasswordResponseDto = UserDto;
export type AddAddressResponseDto = UserDto;
export type UpdateAddressResponseDto = UserDto;
export type DeleteAddressResponseDto = UserDto;
export type SetDefaultAddressResponseDto = UserDto;

export interface DeleteAccountResponseDto extends MessageResponseDto {}
