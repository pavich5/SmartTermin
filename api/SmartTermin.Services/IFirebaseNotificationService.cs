using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartTermin.Services
{
    public interface IFirebaseNotificationService
    {
        Task<bool> SendNotificationAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null);
        Task<bool> SendNotificationToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null);
        Task<bool> SendNotificationToMultipleUsersAsync(List<Guid> userIds, string title, string body, Dictionary<string, string>? data = null);
    }
}

