import { apiRequest } from './apiClient';

export interface Review {
  id: string;
  artistId: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  updatedAt?: string;
  canEdit?: boolean;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface CreateReviewRequest {
  artistId: string;
  serviceId: string;
  rating: number;
  reviewText?: string;
  bookingId?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  reviewText?: string;
}

export async function createReview(request: CreateReviewRequest): Promise<Review> {
  return apiRequest<Review>('/reviews', {
    method: 'POST',
    body: request,
  });
}

export async function updateReview(
  reviewId: string,
  request: UpdateReviewRequest
): Promise<Review> {
  return apiRequest<Review>(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: request,
  });
}

export async function getReviewsForArtist(artistId: string): Promise<ReviewsResponse> {
  return apiRequest<ReviewsResponse>(`/reviews/artist/${artistId}`, {
    method: 'GET',
    auth: false,
  });
}

export async function canReviewService(
  artistId: string,
  serviceId: string
): Promise<{ canReview: boolean }> {
  return apiRequest<{ canReview: boolean }>(
    `/reviews/can-review?artistId=${artistId}&serviceId=${serviceId}`,
    {
      method: 'GET',
    }
  );
}
