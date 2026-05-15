namespace SmartTermin.DTOs
{
    public class ReviewsResponseDto
    {
        public List<ReviewResponseDto> Reviews { get; set; } = new();
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }
}


