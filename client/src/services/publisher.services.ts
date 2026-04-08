import api, { mapApiError } from "@services/api";
import type {
  CreatePublisherDto,
  ListPublishersQueryDto,
  ListPublishersResponseDto,
  PublisherDto,
  UpdatePublisherDto,
} from "@my-types/publisher.dto";

export const publisherService = {
  listPublishers: async (
    params: ListPublishersQueryDto = {},
  ): Promise<ListPublishersResponseDto> => {
    try {
      const response = await api.get<ListPublishersResponseDto>("/publishers", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw mapApiError(error, "Network error: Could not load publishers.");
    }
  },

  getPublisher: async (id: string): Promise<PublisherDto> => {
    try {
      const response = await api.get<PublisherDto>(`/publishers/${id}`);
      return response.data;
    } catch (error: any) {
      throw mapApiError(error, "Network error: Could not load publisher details.");
    }
  },

  createPublisher: async (
    data: CreatePublisherDto,
  ): Promise<PublisherDto> => {
    try {
      const response = await api.post<PublisherDto>("/publishers", data);
      return response.data;
    } catch (error: any) {
      throw mapApiError(error, "Network error: Could not create publisher.");
    }
  },

  updatePublisher: async (
    id: string,
    data: UpdatePublisherDto,
  ): Promise<PublisherDto> => {
    try {
      const response = await api.patch<PublisherDto>(`/publishers/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw mapApiError(error, "Network error: Could not update publisher.");
    }
  },

  deletePublisher: async (id: string): Promise<void> => {
    try {
      await api.delete<void>(`/publishers/${id}`);
    } catch (error: any) {
      throw mapApiError(error, "Network error: Could not delete publisher.");
    }
  },
};

export default publisherService;
