namespace SmartTermin.DTOs
{
    public class WalkInClientDto
    {
        public string Id { get; set; } = string.Empty;
        public string ArtistId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string? ClientEmail { get; set; }
        public string? ClientPhone { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class WalkInClientsResponseDto
    {
        public List<WalkInClientDto> WalkInClients { get; set; } = new List<WalkInClientDto>();
    }

    public class CreateWalkInClientRequestDto
    {
        public string ClientName { get; set; } = string.Empty;
        public string? ClientEmail { get; set; }
        public string? ClientPhone { get; set; }
    }

    public class CreateWalkInClientResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public WalkInClientDto? WalkInClient { get; set; }
    }
}

