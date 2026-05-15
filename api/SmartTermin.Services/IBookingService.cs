using System;
using System.Collections.Generic;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IBookingService
    {
        Task<BookingResponseDto> CreateBookingAsync(Guid clientId, CreateBookingRequestDto request);
        Task<AvailableSlotsResponseDto> GetAvailableSlotsAsync(Guid artistId, List<Guid> serviceIds, DateTime date);
        Task<ArtistBookingsResponseDto> GetArtistBookingsAsync(Guid artistId, DateTime? dateFilter, DateTime? startDate = null, DateTime? endDate = null);
        Task<ClientBookingsResponseDto> GetClientBookingsAsync(Guid clientId, DateTime? dateFilter);
        Task<CancelBookingResponseDto> CancelBookingAsync(Guid bookingId, Guid requesterId);
        Task<BookingResponseDto> RebookAppointmentAsync(Guid bookingId, Guid requesterId, RebookBookingRequestDto request);
        Task<BookingResponseDto> AddWalkInAsync(Guid artistUserId, WalkInBookingRequestDto request);
        Task<BookingResponseDto> ProposeRescheduleAsync(Guid bookingId, Guid artistId, ProposeRescheduleRequestDto request);
        Task<BookingResponseDto> AcceptRescheduleAsync(Guid bookingId, Guid clientId);
        Task<CancelBookingResponseDto> DeclineRescheduleAsync(Guid bookingId, Guid clientId);
    }
}

