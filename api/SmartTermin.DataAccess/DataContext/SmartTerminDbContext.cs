using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.DataContext
{
    public class SmartTerminDbContext : DbContext
    {
        public SmartTerminDbContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Artist> Artists { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<WorkingHour> WorkingHours { get; set; }
        public DbSet<PortfolioImage> PortfolioImages { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingService> BookingServices { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ArtistSubscription> ArtistSubscriptions { get; set; }
        public DbSet<AnalyticsEvent> AnalyticsEvents { get; set; }
        public DbSet<Salon> Salons { get; set; }
        public DbSet<SalonMembership> SalonMemberships { get; set; }
        public DbSet<SalonSubscription> SalonSubscriptions { get; set; }
        public DbSet<SalonInvitation> SalonInvitations { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<SalonHoliday> SalonHolidays { get; set; }
        public DbSet<BlockedClient> BlockedClients { get; set; }
        public DbSet<WalkInClient> WalkInClients { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 1. Users → Artists : One-to-one (user with user_type='artist')
            builder.Entity<Artist>()
                .HasOne(a => a.User)
                .WithOne(u => u.ArtistProfile)
                .HasForeignKey<Artist>(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // 2. Artists → Services : One-to-many
            builder.Entity<Service>()
                .HasOne(s => s.Artist)
                .WithMany(a => a.Services)
                .HasForeignKey(s => s.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. Artists → WorkingHours : One-to-many (7 days max)
            builder.Entity<WorkingHour>()
                .HasOne(w => w.Artist)
                .WithMany(a => a.WorkingHours)
                .HasForeignKey(w => w.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            // 4. Artists → PortfolioImages : One-to-many (optional - can be null for salon images)
            builder.Entity<PortfolioImage>()
                .HasOne(p => p.Artist)
                .WithMany(a => a.PortfolioImages)
                .HasForeignKey(p => p.ArtistId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            // 4.1. Salons → PortfolioImages : One-to-many (optional - can be null for artist images)
            builder.Entity<PortfolioImage>()
                .HasOne(p => p.Salon)
                .WithMany(s => s.PortfolioImages)
                .HasForeignKey(p => p.SalonId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            // Ensure PortfolioImage has either ArtistId or SalonId (but not both)
            // MySQL/MariaDB syntax (no square brackets)
            builder.Entity<PortfolioImage>()
                .HasCheckConstraint("CK_PortfolioImage_ArtistOrSalon", 
                    "(ArtistId IS NOT NULL AND SalonId IS NULL) OR (ArtistId IS NULL AND SalonId IS NOT NULL)");

            // 5. Artists → Bookings : One-to-many
            builder.Entity<Booking>()
                .HasOne(b => b.Artist)
                .WithMany(a => a.Bookings)
                .HasForeignKey(b => b.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. Users (Clients) → Bookings : One-to-many
            builder.Entity<Booking>()
                .HasOne(b => b.Client)
                .WithMany(u => u.ClientBookings)
                .HasForeignKey(b => b.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            // 6.1 Artists → Salon (direct link on Artist for quick lookups)
            builder.Entity<Artist>()
                .HasOne(a => a.Salon)
                .WithMany()
                .HasForeignKey(a => a.SalonId)
                .OnDelete(DeleteBehavior.SetNull);

            // 7. Bookings → Services : Many-to-many (via BookingService)
            builder.Entity<BookingService>()
                .HasKey(bs => new { bs.BookingId, bs.ServiceId });

            builder.Entity<BookingService>()
                .HasOne(bs => bs.Booking)
                .WithMany(b => b.BookingServices)
                .HasForeignKey(bs => bs.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // 8. Artists → ArtistSubscriptions : One-to-many
            builder.Entity<ArtistSubscription>()
                .HasOne(a => a.Artist)
                .WithMany(a => a.ArtistSubscriptions)
                .HasForeignKey(a => a.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ArtistSubscription>()
                .Property(a => a.MonthlyCost)
                .HasPrecision(18, 2);

            // Configure decimal precision for all decimal properties
            // AnalyticsEvent.Revenue - money value
            builder.Entity<AnalyticsEvent>()
                .Property(e => e.Revenue)
                .HasPrecision(18, 2);

            // Artist.Latitude and Longitude - GPS coordinates (standard: 9,6)
            builder.Entity<Artist>()
                .Property(a => a.Latitude)
                .HasPrecision(9, 6);

            builder.Entity<Artist>()
                .Property(a => a.Longitude)
                .HasPrecision(9, 6);

            // Artist.Rating - rating value (e.g., 4.50)
            builder.Entity<Artist>()
                .Property(a => a.Rating)
                .HasPrecision(3, 2);

            // Booking.TotalPrice - money value
            builder.Entity<Booking>()
                .Property(b => b.TotalPrice)
                .HasPrecision(18, 2)
                .IsRequired(false);

            // BookingService.Price - money value
            builder.Entity<BookingService>()
                .Property(bs => bs.Price)
                .HasPrecision(18, 2);

            // Service.Price - money value
            builder.Entity<Service>()
                .Property(s => s.Price)
                .HasPrecision(18, 2);

            // Reviews → Service relationship
            builder.Entity<Review>()
                .HasOne(r => r.Service)
                .WithMany()
                .HasForeignKey(r => r.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint: One review per client per artist per service
            builder.Entity<Review>()
                .HasIndex(r => new { r.ClientId, r.ArtistId, r.ServiceId })
                .IsUnique();

            // Make PhoneVerificationCode nullable since verification happens before user creation (stored in cache)
            builder.Entity<User>()
                .Property(u => u.PhoneVerificationCode)
                .IsRequired(false);

            // 9. Salons → Owner (User)
            builder.Entity<Salon>()
                .HasOne(s => s.Owner)
                .WithMany(u => u.OwnedSalons)
                .HasForeignKey(s => s.OwnerUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // 10. Salons → Memberships
            builder.Entity<SalonMembership>()
                .HasOne(sm => sm.Salon)
                .WithMany(s => s.Memberships)
                .HasForeignKey(sm => sm.SalonId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SalonMembership>()
                .HasOne(sm => sm.Artist)
                .WithMany(a => a.SalonMemberships)
                .HasForeignKey(sm => sm.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SalonMembership>()
                .HasIndex(sm => new { sm.SalonId, sm.ArtistId })
                .IsUnique();

            // 11. Salon Subscriptions (one-to-one)
            builder.Entity<SalonSubscription>()
                .HasOne(ss => ss.Salon)
                .WithOne(s => s.Subscription)
                .HasForeignKey<SalonSubscription>(ss => ss.SalonId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SalonSubscription>()
                .Property(ss => ss.MonthlyCost)
                .HasPrecision(18, 2);

            // 12. Salon Invitations
            builder.Entity<SalonInvitation>()
                .HasOne(inv => inv.Salon)
                .WithMany(s => s.Invitations)
                .HasForeignKey(inv => inv.SalonId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SalonInvitation>()
                .HasOne(inv => inv.InvitedByUser)
                .WithMany(u => u.SentSalonInvitations)
                .HasForeignKey(inv => inv.InvitedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SalonInvitation>()
                .HasIndex(inv => inv.Token)
                .IsUnique();

            // Unique constraint for Artist CustomBookingLink
            // MySQL/MariaDB syntax (use backticks instead of square brackets)
            builder.Entity<Artist>()
                .HasIndex(a => a.CustomBookingLink)
                .IsUnique()
                .HasFilter("`CustomBookingLink` IS NOT NULL AND `CustomBookingLink` != ''");

            // Unique constraint for Salon CustomBookingLink
            // MySQL/MariaDB syntax (use backticks instead of square brackets)
            builder.Entity<Salon>()
                .HasIndex(s => s.CustomBookingLink)
                .IsUnique()
                .HasFilter("`CustomBookingLink` IS NOT NULL AND `CustomBookingLink` != ''");

            // 13. Artists → Holidays : One-to-many
            builder.Entity<Holiday>()
                .HasOne(h => h.Artist)
                .WithMany(a => a.Holidays)
                .HasForeignKey(h => h.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: One holiday per artist per date
            builder.Entity<Holiday>()
                .HasIndex(h => new { h.ArtistId, h.HolidayDate })
                .IsUnique();

            // 14. Salons → SalonHolidays : One-to-many
            builder.Entity<SalonHoliday>()
                .HasOne(sh => sh.Salon)
                .WithMany(s => s.Holidays)
                .HasForeignKey(sh => sh.SalonId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: One holiday per salon per date
            builder.Entity<SalonHoliday>()
                .HasIndex(sh => new { sh.SalonId, sh.HolidayDate })
                .IsUnique();

            // 15. BlockedClients relationships
            builder.Entity<BlockedClient>()
                .HasOne(bc => bc.Client)
                .WithMany()
                .HasForeignKey(bc => bc.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<BlockedClient>()
                .HasOne(bc => bc.Artist)
                .WithMany()
                .HasForeignKey(bc => bc.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<BlockedClient>()
                .HasOne(bc => bc.Salon)
                .WithMany()
                .HasForeignKey(bc => bc.SalonId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<BlockedClient>()
                .HasOne(bc => bc.BlockedByUser)
                .WithMany()
                .HasForeignKey(bc => bc.BlockedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint: One block per client per artist or salon
            // MySQL/MariaDB syntax (use backticks instead of square brackets)
            builder.Entity<BlockedClient>()
                .HasIndex(bc => new { bc.ArtistId, bc.ClientId })
                .IsUnique()
                .HasFilter("`ArtistId` IS NOT NULL");

            builder.Entity<BlockedClient>()
                .HasIndex(bc => new { bc.SalonId, bc.ClientId })
                .IsUnique()
                .HasFilter("`SalonId` IS NOT NULL");

            // 16. WalkInClients relationships
            builder.Entity<WalkInClient>()
                .HasOne(wic => wic.Artist)
                .WithMany()
                .HasForeignKey(wic => wic.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }
}
