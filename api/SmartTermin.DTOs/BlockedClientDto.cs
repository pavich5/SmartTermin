namespace SmartTermin.DTOs
{
    public class BlockClientRequestDto
    {
        public string ClientId { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class BlockedClientDto
    {
        public string Id { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string? ClientEmail { get; set; }
        public string? ClientPhone { get; set; }
        public string? ArtistId { get; set; }
        public string? SalonId { get; set; }
        public string? Reason { get; set; }
        public DateTime BlockedAt { get; set; }
        public string BlockedByUserName { get; set; } = string.Empty;
    }

    public class BlockedClientsResponseDto
    {
        public List<BlockedClientDto> BlockedClients { get; set; } = new List<BlockedClientDto>();
    }

    public class BlockClientResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public BlockedClientDto? BlockedClient { get; set; }
    }

    public class UnblockClientResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}











