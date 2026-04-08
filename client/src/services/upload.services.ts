import api, { mapApiError } from "@services/api";

export interface UploadFileResponseDto {
	url: string;
	path: string;
	filename: string;
	mimetype: string;
	size: number;
}

export const uploadService = {
	uploadFile: async (file: File, type: "cover" | "asset" | "sample" = "asset"): Promise<UploadFileResponseDto> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);

		try {
			const response = await api.post<UploadFileResponseDto>("/uploads", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not upload file.");
		}
	},
};

export default uploadService;
