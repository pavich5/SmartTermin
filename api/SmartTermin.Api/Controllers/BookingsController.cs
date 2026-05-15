using System;
using System.Globalization;
using System.Security.Claims;
using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly IArtistService _artistService;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(IBookingService bookingService, IArtistService artistService, ILogger<BookingsController> logger)
        {
            _bookingService = bookingService;
            _artistService = artistService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<BookingResponseDto>> CreateBooking([FromBody] CreateBookingRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var booking = await _bookingService.CreateBookingAsync(clientId, request);
                return Ok(booking);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create booking");
                return StatusCode(500, new { message = "An error occurred while creating the booking" });
            }
        }

        [HttpGet("available-slots")]
        public async Task<ActionResult<AvailableSlotsResponseDto>> GetAvailableSlots([FromQuery] string artistId, [FromQuery] string serviceIds, [FromQuery] string date)
        {
            if (string.IsNullOrWhiteSpace(artistId) || string.IsNullOrWhiteSpace(serviceIds))
            {
                return BadRequest(new { message = "artistId and serviceIds are required" });
            }

            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
            {
                return BadRequest(new { message = "date must be in YYYY-MM-DD format" });
            }

            // Resolve artist ID - try as GUID first, then as custom booking link
            Guid resolvedArtistId;
            if (Guid.TryParse(artistId, out var artistGuid))
            {
                resolvedArtistId = artistGuid;
            }
            else
            {
                // Try as custom booking link
                var artist = await _artistService.GetArtistByCustomBookingLinkAsync(artistId);
                if (artist == null)
                {
                    return NotFound(new { message = "Artist not found" });
                }
                if (!Guid.TryParse(artist.Id, out resolvedArtistId))
                {
                    return BadRequest(new { message = "Invalid artist ID format" });
                }
            }

            // Parse service IDs from comma-separated string
            var serviceIdList = new List<Guid>();
            var serviceIdStrings = serviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var serviceIdStr in serviceIdStrings)
            {
                if (Guid.TryParse(serviceIdStr, out var serviceId))
                {
                    serviceIdList.Add(serviceId);
                }
                else
                {
                    return BadRequest(new { message = $"Invalid service ID format: {serviceIdStr}" });
                }
            }

            if (serviceIdList.Count == 0)
            {
                return BadRequest(new { message = "At least one valid serviceId is required" });
            }

            try
            {
                var response = await _bookingService.GetAvailableSlotsAsync(resolvedArtistId, serviceIdList, parsedDate);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get available slots");
                return StatusCode(500, new { message = "An error occurred while retrieving available slots" });
            }
        }

        [HttpGet("artist")]
        [Authorize]
        public async Task<ActionResult<ArtistBookingsResponseDto>> GetArtistBookings([FromQuery] string? date = null, [FromQuery] string? startDate = null, [FromQuery] string? endDate = null)
        {
            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            DateTime? dateFilter = null;
            if (!string.IsNullOrWhiteSpace(date))
            {
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    return BadRequest(new { message = "date must be in YYYY-MM-DD format" });
                }

                dateFilter = parsedDate;
            }

            DateTime? startDateFilter = null;
            DateTime? endDateFilter = null;
            if (!string.IsNullOrWhiteSpace(startDate) && !string.IsNullOrWhiteSpace(endDate))
            {
                if (!DateTime.TryParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedStartDate))
                {
                    return BadRequest(new { message = "startDate must be in YYYY-MM-DD format" });
                }
                if (!DateTime.TryParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedEndDate))
                {
                    return BadRequest(new { message = "endDate must be in YYYY-MM-DD format" });
                }

                startDateFilter = parsedStartDate;
                endDateFilter = parsedEndDate;
            }

            try
            {
                var response = await _bookingService.GetArtistBookingsAsync(artistUserId, dateFilter, startDateFilter, endDateFilter);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get artist bookings for user {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving bookings" });
            }
        }

        [HttpGet("client")]
        [Authorize]
        public async Task<ActionResult<ClientBookingsResponseDto>> GetClientBookings([FromQuery] string? date = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            DateTime? dateFilter = null;
            if (!string.IsNullOrWhiteSpace(date))
            {
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    return BadRequest(new { message = "date must be in YYYY-MM-DD format" });
                }

                dateFilter = parsedDate;
            }

            try
            {
                var response = await _bookingService.GetClientBookingsAsync(clientId, dateFilter);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get client bookings for user {UserId}", clientId);
                return StatusCode(500, new { message = "An error occurred while retrieving bookings" });
            }
        }

        [HttpPut("{id}/cancel")]
        [Authorize]
        public async Task<ActionResult<CancelBookingResponseDto>> CancelBooking(string id)
        {
            if (!Guid.TryParse(id, out var bookingId))
            {
                return BadRequest(new { message = "Invalid booking id" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var requesterId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.CancelBookingAsync(bookingId, requesterId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel booking {BookingId}", bookingId);
                return StatusCode(500, new { message = "An error occurred while cancelling the booking" });
            }
        }

        [HttpPost("{id}/rebook")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDto>> RebookBooking(string id, [FromBody] RebookBookingRequestDto request)
        {
            if (!Guid.TryParse(id, out var bookingId))
            {
                return BadRequest(new { message = "Invalid booking id" });
            }

            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToList();
                
                var errorMessage = errors.Any() 
                    ? string.Join("; ", errors) 
                    : "Invalid request data";
                
                return BadRequest(new { message = errorMessage });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var requesterId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.RebookAppointmentAsync(bookingId, requesterId, request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to rebook booking {BookingId}: {Message}", bookingId, ex.Message);
                var errorMessage = ex.Message.Contains("not found") 
                    ? ex.Message
                    : ex.Message.Contains("not available") || ex.Message.Contains("outside")
                    ? ex.Message
                    : "An error occurred while rebooking";
                return StatusCode(500, new { message = errorMessage });
            }
        }

        [HttpPost("walk-in")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDto>> AddWalkInBooking([FromBody] WalkInBookingRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.AddWalkInAsync(artistUserId, request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add walk-in booking");
                return StatusCode(500, new { message = "An error occurred while creating the walk-in booking" });
            }
        }

        [HttpPost("{id}/propose-reschedule")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDto>> ProposeReschedule(string id, [FromBody] ProposeRescheduleRequestDto request)
        {
            if (!Guid.TryParse(id, out var bookingId))
            {
                return BadRequest(new { message = "Invalid booking id" });
            }

            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToList();
                
                var errorMessage = errors.Any() 
                    ? string.Join("; ", errors) 
                    : "Invalid request data";
                
                return BadRequest(new { message = errorMessage });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.ProposeRescheduleAsync(bookingId, artistId, request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to propose reschedule for booking {BookingId}: {Message}", bookingId, ex.Message);
                return StatusCode(500, new { message = "An error occurred while proposing reschedule" });
            }
        }

        [HttpPost("{id}/accept-reschedule")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDto>> AcceptReschedule(string id)
        {
            if (!Guid.TryParse(id, out var bookingId))
            {
                return BadRequest(new { message = "Invalid booking id" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.AcceptRescheduleAsync(bookingId, clientId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to accept reschedule for booking {BookingId}: {Message}", bookingId, ex.Message);
                return StatusCode(500, new { message = "An error occurred while accepting reschedule" });
            }
        }

        [HttpPost("{id}/decline-reschedule")]
        [Authorize]
        public async Task<ActionResult<CancelBookingResponseDto>> DeclineReschedule(string id)
        {
            if (!Guid.TryParse(id, out var bookingId))
            {
                return BadRequest(new { message = "Invalid booking id" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _bookingService.DeclineRescheduleAsync(bookingId, clientId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to decline reschedule for booking {BookingId}: {Message}", bookingId, ex.Message);
                return StatusCode(500, new { message = "An error occurred while declining reschedule" });
            }
        }
    }
}

