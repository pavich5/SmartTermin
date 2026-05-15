using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class ServiceManagementService : IServiceManagementService
    {
        private readonly IServiceRepository _serviceRepository;
        private readonly IUserRepository _userRepository;

        public ServiceManagementService(IServiceRepository serviceRepository, IUserRepository userRepository)
        {
            _serviceRepository = serviceRepository;
            _userRepository = userRepository;
        }

        public async Task<ServiceListResponseDto> GetServicesForArtistAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var services = await _serviceRepository.GetServicesForArtistAsync(artist.Id);

            var response = new ServiceListResponseDto();

            foreach (var service in services)
            {
                var bookingsCount = service.BookingServices?.Count ?? 0;
                var revenue = service.BookingServices?.Sum(bs => bs.Price) ?? 0m;

                response.Services.Add(new ServiceSummaryDto
                {
                    Id = service.Id.ToString(),
                    Name = service.Name,
                    Duration = service.DurationMinutes,
                    Price = service.Price,
                    Description = service.Description,
                    Bookings = bookingsCount,
                    Revenue = revenue.ToString("C0", CultureInfo.InvariantCulture)
                });
            }

            return response;
        }

        public async Task<ServiceDetailsDto> CreateServiceAsync(Guid artistUserId, CreateServiceRequestDto request)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var service = new DomainModels.Models.Service
            {
                ArtistId = artist.Id,
                Name = request.Name,
                Description = request.Description,
                DurationMinutes = request.Duration,
                Price = request.Price,
                IsActive = true
            };

            service = await _serviceRepository.CreateServiceAsync(service);

            return MapToDetails(service);
        }

        public async Task<ServiceDetailsDto> UpdateServiceAsync(Guid artistUserId, Guid serviceId, UpdateServiceRequestDto request)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var service = await _serviceRepository.GetServiceByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Service not found");

            if (service.ArtistId != artist.Id)
            {
                throw new UnauthorizedAccessException("Cannot modify this service");
            }

            if (request.Name != null)
            {
                service.Name = request.Name;
            }

            if (request.Duration.HasValue)
            {
                service.DurationMinutes = request.Duration.Value;
            }

            if (request.Price.HasValue)
            {
                service.Price = request.Price.Value;
            }

            if (request.Description != null)
            {
                service.Description = request.Description;
            }

            await _serviceRepository.UpdateServiceAsync(service);

            return MapToDetails(service);
        }

        public async Task<bool> DeleteServiceAsync(Guid artistUserId, Guid serviceId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var service = await _serviceRepository.GetServiceByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Service not found");

            if (service.ArtistId != artist.Id)
            {
                throw new UnauthorizedAccessException("Cannot delete this service");
            }

            service.IsActive = false;
            await _serviceRepository.UpdateServiceAsync(service);
            return true;
        }

        private static ServiceDetailsDto MapToDetails(DomainModels.Models.Service service)
        {
            return new ServiceDetailsDto
            {
                Id = service.Id.ToString(),
                Name = service.Name,
                Duration = service.DurationMinutes,
                Price = service.Price,
                Description = service.Description
            };
        }
    }
}

