using SmartTermin.DataAccess.Repositories;
using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;
using System.Text.Json;

namespace SmartTermin.Services
{
    public class ReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IPortfolioRepository _portfolioRepository;

        public ReviewService(
            IReviewRepository reviewRepository,
            IBookingRepository bookingRepository,
            IPortfolioRepository portfolioRepository)
        {
            _reviewRepository = reviewRepository;
            _bookingRepository = bookingRepository;
            _portfolioRepository = portfolioRepository;
        }

        public async Task<ReviewResponseDto> CreateReviewAsync(CreateReviewRequestDto request, Guid clientId)
        {
            // Validate artist exists
            var artist = await _portfolioRepository.GetArtistByIdAsync(Guid.Parse(request.ArtistId));
            if (artist == null)
            {
                throw new KeyNotFoundException("Artist not found");
            }

            // Validate service exists and belongs to artist
            var service = await _bookingRepository.GetServiceByIdAsync(Guid.Parse(request.ServiceId));
            if (service == null || service.ArtistId != artist.Id)
            {
                throw new KeyNotFoundException("Service not found or does not belong to this artist");
            }

            // Check if client has already reviewed this service
            var existingReview = await _reviewRepository.GetReviewByClientServiceAsync(
                clientId, 
                artist.Id, 
                service.Id);

            if (existingReview != null)
            {
                throw new InvalidOperationException("You have already reviewed this service. You can only leave one review per service.");
            }

            // Validate that client has a completed booking for this service
            // Check if appointment time has passed
            var clientBookings = await _bookingRepository.GetBookingsForClientAsync(clientId, null);
            var hasValidBooking = false;
            Booking? validBooking = null;

            foreach (var booking in clientBookings)
            {
                if (booking.ArtistId != artist.Id || 
                    string.Equals(booking.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                // Check if this booking includes the service
                var bookingHasService = booking.BookingServices?.Any(bs => bs.ServiceId == service.Id) ?? false;
                if (!bookingHasService)
                {
                    continue;
                }

                // Check if appointment time has passed
                var appointmentDateTime = booking.BookingDate.Date.Add(booking.BookingTime);
                var appointmentEndTime = appointmentDateTime.AddMinutes(booking.TotalDurationMinutes);

                if (DateTime.UtcNow >= appointmentEndTime)
                {
                    hasValidBooking = true;
                    validBooking = booking;
                    break;
                }
            }

            if (!hasValidBooking)
            {
                throw new InvalidOperationException("You can only review services after your appointment time has passed. Please wait until after your appointment to leave a review.");
            }

            // Create review
            var review = new Review
            {
                ArtistId = artist.Id,
                ClientId = clientId,
                ServiceId = service.Id,
                BookingId = validBooking?.Id,
                Rating = request.Rating,
                ReviewText = request.ReviewText ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            var createdReview = await _reviewRepository.CreateReviewAsync(review);

            // Update artist rating
            await UpdateArtistRatingAsync(artist.Id);

            return MapToDto(createdReview, false);
        }

        public async Task<ReviewResponseDto> UpdateReviewAsync(Guid reviewId, UpdateReviewRequestDto request, Guid clientId)
        {
            var review = await _reviewRepository.GetReviewByIdAsync(reviewId);
            if (review == null)
            {
                throw new KeyNotFoundException("Review not found");
            }

            if (review.ClientId != clientId)
            {
                throw new UnauthorizedAccessException("You can only edit your own reviews");
            }

            // Check if review can be edited (within 24 hours)
            var hoursSinceCreation = (DateTime.UtcNow - review.CreatedAt).TotalHours;
            if (hoursSinceCreation > 24)
            {
                throw new InvalidOperationException("Reviews can only be edited within 24 hours of creation");
            }

            review.Rating = request.Rating;
            review.ReviewText = request.ReviewText ?? string.Empty;
            review.UpdatedAt = DateTime.UtcNow;

            await _reviewRepository.UpdateReviewAsync(review);

            // Update artist rating
            await UpdateArtistRatingAsync(review.ArtistId);

            return MapToDto(review, true);
        }

        public async Task<ReviewsResponseDto> GetReviewsForArtistAsync(Guid artistId, Guid? clientId = null)
        {
            var reviews = await _reviewRepository.GetReviewsForArtistAsync(artistId);
            
            var reviewDtos = reviews.Select(r => 
            {
                var canEdit = clientId.HasValue && 
                             r.ClientId == clientId.Value && 
                             (DateTime.UtcNow - r.CreatedAt).TotalHours <= 24;
                return MapToDto(r, canEdit);
            }).ToList();

            var averageRating = reviews.Any() 
                ? reviews.Average(r => r.Rating) 
                : 0.0;

            var ratingDistribution = reviews
                .GroupBy(r => r.Rating)
                .ToDictionary(g => g.Key, g => g.Count());

            return new ReviewsResponseDto
            {
                Reviews = reviewDtos,
                AverageRating = Math.Round(averageRating, 2),
                TotalReviews = reviews.Count,
                RatingDistribution = ratingDistribution
            };
        }

        public async Task<bool> CanClientReviewServiceAsync(Guid clientId, Guid artistId, Guid serviceId)
        {
            // Check if already reviewed
            var hasReviewed = await _reviewRepository.HasClientReviewedServiceAsync(clientId, artistId, serviceId);
            if (hasReviewed)
            {
                return false;
            }

            // Check if client has a completed booking for this service where appointment time has passed
            var clientBookings = await _bookingRepository.GetBookingsForClientAsync(clientId, null);
            
            foreach (var booking in clientBookings)
            {
                if (booking.ArtistId != artistId || 
                    string.Equals(booking.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var bookingHasService = booking.BookingServices?.Any(bs => bs.ServiceId == serviceId) ?? false;
                if (!bookingHasService)
                {
                    continue;
                }

                var appointmentDateTime = booking.BookingDate.Date.Add(booking.BookingTime);
                var appointmentEndTime = appointmentDateTime.AddMinutes(booking.TotalDurationMinutes);

                if (DateTime.UtcNow >= appointmentEndTime)
                {
                    return true;
                }
            }

            return false;
        }

        private async Task UpdateArtistRatingAsync(Guid artistId)
        {
            var reviews = await _reviewRepository.GetReviewsForArtistAsync(artistId);
            var averageRating = reviews.Any() 
                ? (double?)reviews.Average(r => r.Rating) 
                : null;

            var artist = await _portfolioRepository.GetArtistByIdAsync(artistId);
            if (artist != null)
            {
                artist.Rating = averageRating.HasValue ? (decimal)averageRating.Value : null;
                artist.TotalReviews = reviews.Count;
                await _portfolioRepository.UpdateArtistAsync(artist);
            }
        }

        private ReviewResponseDto MapToDto(Review review, bool canEdit)
        {
            return new ReviewResponseDto
            {
                Id = review.Id.ToString(),
                ArtistId = review.ArtistId.ToString(),
                ClientId = review.ClientId.ToString(),
                ClientName = review.Client?.FullName ?? "Anonymous",
                ServiceId = review.ServiceId.ToString(),
                ServiceName = review.Service?.Name ?? "Unknown Service",
                Rating = review.Rating,
                ReviewText = review.ReviewText,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                CanEdit = canEdit
            };
        }
    }
}

