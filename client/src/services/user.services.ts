// client/src/services/user.services.ts
import api, { mapApiError } from "@services/api";
import type {
	AddAddressRequestDto,
	AddAddressResponseDto,
	ChangePasswordRequestDto,
	ChangePasswordResponseDto,
	DeleteAccountResponseDto,
	DeleteAddressResponseDto,
	GetProfileResponseDto,
	SetDefaultAddressResponseDto,
	UpdateAddressRequestDto,
	UpdateAddressResponseDto,
	UpdateProfileRequestDto,
	UpdateProfileResponseDto,
} from "@my-types/user.dto";

export const userService = {
	// Keep both names for compatibility with existing calls in AuthContext.
	fetchProfile: async (): Promise<GetProfileResponseDto> => {
		try {
			const response = await api.get<GetProfileResponseDto>("/users/profile");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch user profile.");
		}
	},

	getCurrentUser: async (): Promise<GetProfileResponseDto> => {
		try {
			const response = await api.get<GetProfileResponseDto>("/users/profile");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch current user.");
		}
	},

	updateProfile: async (data: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> => {
		try {
			const response = await api.put<UpdateProfileResponseDto>("/users/profile", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not update profile.");
		}
	},

	changePassword: async (data: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> => {
		try {
			const response = await api.put<ChangePasswordResponseDto>("/users/change-password", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not change password.");
		}
	},

	addAddress: async (data: AddAddressRequestDto): Promise<AddAddressResponseDto> => {
		try {
			const response = await api.post<AddAddressResponseDto>("/users/addresses", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not add address.");
		}
	},

	updateAddress: async (index: number, data: UpdateAddressRequestDto): Promise<UpdateAddressResponseDto> => {
		try {
			const response = await api.put<UpdateAddressResponseDto>(`/users/addresses/${index}`, data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not update address.");
		}
	},

	deleteAddress: async (index: number): Promise<DeleteAddressResponseDto> => {
		try {
			const response = await api.delete<DeleteAddressResponseDto>(`/users/addresses/${index}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not delete address.");
		}
	},

	setDefaultAddress: async (index: number): Promise<SetDefaultAddressResponseDto> => {
		try {
			const response = await api.patch<SetDefaultAddressResponseDto>(`/users/addresses/${index}/default`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not set default address.");
		}
	},

	deleteAccount: async (): Promise<DeleteAccountResponseDto> => {
		try {
			const response = await api.delete<DeleteAccountResponseDto>("/users/me");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not delete account.");
		}
	},
};

export default userService;
