using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;
using SmartTermin.DomainModels.Models;

namespace SmartTermin.Services
{
    public class WorkingHoursService : IWorkingHoursService
    {
        private readonly IWorkingHoursRepository _workingHoursRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISalonRepository _salonRepository;

        public WorkingHoursService(IWorkingHoursRepository workingHoursRepository, IUserRepository userRepository, ISalonRepository salonRepository)
        {
            _workingHoursRepository = workingHoursRepository;
            _userRepository = userRepository;
            _salonRepository = salonRepository;
        }

        public async Task<WorkingHoursResponseDto> GetWorkingHoursAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var workingHours = await _workingHoursRepository.GetWorkingHoursForArtistAsync(artist.Id);
            var response = new WorkingHoursResponseDto();

            var dayMapping = new Dictionary<string, int>
            {
                { "monday", 1 },
                { "tuesday", 2 },
                { "wednesday", 3 },
                { "thursday", 4 },
                { "friday", 5 },
                { "saturday", 6 },
                { "sunday", 0 }
            };

            foreach (var day in dayMapping)
            {
                var workingHour = workingHours.FirstOrDefault(wh => wh.DayOfWeek == day.Value);
                var isClosed = workingHour == null || !workingHour.IsAvailable;
                var dayDto = new DayWorkingHoursDto
                {
                    Start = !isClosed ? FormatTime(workingHour!.StartTime) : "09:00",
                    End = !isClosed ? FormatTime(workingHour!.EndTime) : "17:00",
                    Closed = isClosed,
                    Breaks = !isClosed && !string.IsNullOrWhiteSpace(workingHour!.BreaksJson) 
                        ? JsonSerializer.Deserialize<List<BreakDto>>(workingHour.BreaksJson) 
                        : new List<BreakDto>()
                };

                switch (day.Key)
                {
                    case "monday":
                        response.Monday = dayDto;
                        break;
                    case "tuesday":
                        response.Tuesday = dayDto;
                        break;
                    case "wednesday":
                        response.Wednesday = dayDto;
                        break;
                    case "thursday":
                        response.Thursday = dayDto;
                        break;
                    case "friday":
                        response.Friday = dayDto;
                        break;
                    case "saturday":
                        response.Saturday = dayDto;
                        break;
                    case "sunday":
                        response.Sunday = dayDto;
                        break;
                }
            }

            return response;
        }

        public async Task<UpdateWorkingHoursResponseDto> UpdateWorkingHoursAsync(Guid artistUserId, UpdateWorkingHoursRequestDto request)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var dayMapping = new Dictionary<string, (int dayOfWeek, DayWorkingHoursDto dto)>
            {
                { "monday", (1, request.Monday) },
                { "tuesday", (2, request.Tuesday) },
                { "wednesday", (3, request.Wednesday) },
                { "thursday", (4, request.Thursday) },
                { "friday", (5, request.Friday) },
                { "saturday", (6, request.Saturday) },
                { "sunday", (0, request.Sunday) }
            };

            foreach (var day in dayMapping)
            {
                var (dayOfWeek, dayDto) = day.Value;

                if (dayDto.Closed)
                {
                    var existing = await _workingHoursRepository.GetWorkingHourForDayAsync(artist.Id, dayOfWeek);
                    if (existing != null)
                    {
                        existing.IsAvailable = false;
                        await _workingHoursRepository.CreateOrUpdateWorkingHourAsync(existing);
                    }
                    else
                    {
                        var workingHour = new DomainModels.Models.WorkingHour
                        {
                            ArtistId = artist.Id,
                            DayOfWeek = dayOfWeek,
                            StartTime = TimeSpan.Zero,
                            EndTime = TimeSpan.Zero,
                            IsAvailable = false
                        };
                        await _workingHoursRepository.CreateOrUpdateWorkingHourAsync(workingHour);
                    }
                }
                else
                {
                    if (!TimeSpan.TryParseExact(dayDto.Start, @"hh\:mm", CultureInfo.InvariantCulture, out var startTime) ||
                        !TimeSpan.TryParseExact(dayDto.End, @"hh\:mm", CultureInfo.InvariantCulture, out var endTime))
                    {
                        throw new InvalidOperationException($"Invalid time format for {day.Key}");
                    }

                    var existing = await _workingHoursRepository.GetWorkingHourForDayAsync(artist.Id, dayOfWeek);
                    var breaksJson = dayDto.Breaks != null && dayDto.Breaks.Any()
                        ? JsonSerializer.Serialize(dayDto.Breaks)
                        : null;

                    if (existing != null)
                    {
                        existing.StartTime = startTime;
                        existing.EndTime = endTime;
                        existing.IsAvailable = true;
                        existing.BreaksJson = breaksJson;
                        await _workingHoursRepository.CreateOrUpdateWorkingHourAsync(existing);
                    }
                    else
                    {
                        var workingHour = new DomainModels.Models.WorkingHour
                        {
                            ArtistId = artist.Id,
                            DayOfWeek = dayOfWeek,
                            StartTime = startTime,
                            EndTime = endTime,
                            IsAvailable = true,
                            BreaksJson = breaksJson
                        };
                        await _workingHoursRepository.CreateOrUpdateWorkingHourAsync(workingHour);
                    }
                }
            }

            var updatedHours = await GetWorkingHoursAsync(artistUserId);

            return new UpdateWorkingHoursResponseDto
            {
                Success = true,
                WorkingHours = updatedHours
            };
        }

        public async Task<SalonArtistsWorkingHoursResponseDto> GetSalonArtistsWorkingHoursAsync(Guid salonId)
        {
            // Get all artists in the salon
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new InvalidOperationException("Salon not found");

            var memberships = await _salonRepository.GetMembersAsync(salonId);
            var artistIds = memberships
                .Where(m => m.Status == "active")
                .Select(m => m.ArtistId)
                .ToList();

            if (!artistIds.Any())
            {
                return new SalonArtistsWorkingHoursResponseDto();
            }

            // Get working hours for all artists
            var workingHoursDict = await _workingHoursRepository.GetWorkingHoursForArtistsAsync(artistIds);

            // Get artist details
            var artists = new List<ArtistWorkingHoursDto>();
            var dayMapping = new Dictionary<string, int>
            {
                { "monday", 1 },
                { "tuesday", 2 },
                { "wednesday", 3 },
                { "thursday", 4 },
                { "friday", 5 },
                { "saturday", 6 },
                { "sunday", 0 }
            };

            foreach (var membership in memberships.Where(m => m.Status == "active"))
            {
                var artist = membership.Artist;
                if (artist == null) continue;

                var artistWorkingHours = workingHoursDict.ContainsKey(artist.Id)
                    ? workingHoursDict[artist.Id]
                    : new List<WorkingHour>();

                var workingHoursDto = new WorkingHoursResponseDto();

                foreach (var day in dayMapping)
                {
                    var workingHour = artistWorkingHours.FirstOrDefault(wh => wh.DayOfWeek == day.Value);
                    var isClosed = workingHour == null || !workingHour.IsAvailable;
                    var dayDto = new DayWorkingHoursDto
                    {
                        Start = !isClosed ? FormatTime(workingHour!.StartTime) : "09:00",
                        End = !isClosed ? FormatTime(workingHour!.EndTime) : "17:00",
                        Closed = isClosed,
                        Breaks = !isClosed && !string.IsNullOrWhiteSpace(workingHour!.BreaksJson)
                            ? JsonSerializer.Deserialize<List<BreakDto>>(workingHour.BreaksJson)
                            : new List<BreakDto>()
                    };

                    switch (day.Key)
                    {
                        case "monday":
                            workingHoursDto.Monday = dayDto;
                            break;
                        case "tuesday":
                            workingHoursDto.Tuesday = dayDto;
                            break;
                        case "wednesday":
                            workingHoursDto.Wednesday = dayDto;
                            break;
                        case "thursday":
                            workingHoursDto.Thursday = dayDto;
                            break;
                        case "friday":
                            workingHoursDto.Friday = dayDto;
                            break;
                        case "saturday":
                            workingHoursDto.Saturday = dayDto;
                            break;
                        case "sunday":
                            workingHoursDto.Sunday = dayDto;
                            break;
                    }
                }

                artists.Add(new ArtistWorkingHoursDto
                {
                    ArtistId = artist.Id.ToString(),
                    ArtistName = artist.User?.FullName ?? "Unknown",
                    ProfileImageUrl = artist.PortfolioImages?.FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl,
                    WorkingHours = workingHoursDto
                });
            }

            return new SalonArtistsWorkingHoursResponseDto
            {
                Artists = artists
            };
        }

        private static string FormatTime(TimeSpan time)
        {
            return time.ToString(@"hh\:mm");
        }
    }
}

