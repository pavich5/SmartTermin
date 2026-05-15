using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Services
{
    /// <summary>
    /// AES encryption service for API responses
    /// </summary>
    public class EncryptionService : IEncryptionService
    {
        private readonly string _encryptionKey;
        private readonly bool _isProduction;
        private readonly ILogger<EncryptionService> _logger;

        public EncryptionService(IConfiguration configuration, ILogger<EncryptionService> logger)
        {
            _logger = logger;
            
            // Check if we're in production
            var environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? 
                             Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? 
                             "Development";
            _isProduction = environment.Equals("Production", StringComparison.OrdinalIgnoreCase);

            // Get encryption key from configuration
            _encryptionKey = configuration["EncryptionSettings:Key"] 
                ?? configuration["Encryption:Key"]
                ?? throw new InvalidOperationException("Encryption key not configured. Please set EncryptionSettings:Key in appsettings.json");

            // Validate key length (AES-256 requires 32 bytes = 64 hex characters)
            if (_encryptionKey.Length < 32)
            {
                throw new InvalidOperationException("Encryption key must be at least 32 characters long");
            }
        }

        public bool IsEncryptionEnabled()
        {
            return _isProduction;
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
            {
                return plainText;
            }

            if (!_isProduction)
            {
                // In development, return plain text
                return plainText;
            }

            try
            {
                using (var aes = Aes.Create())
                {
                    // Derive key and IV from the encryption key
                    var key = DeriveKey(_encryptionKey, 32); // 32 bytes for AES-256
                    var iv = DeriveKey(_encryptionKey + "IV", 16); // 16 bytes for IV

                    aes.Key = key;
                    aes.IV = iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using (var encryptor = aes.CreateEncryptor())
                    using (var msEncrypt = new MemoryStream())
                    {
                        using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                        using (var swEncrypt = new StreamWriter(csEncrypt))
                        {
                            swEncrypt.Write(plainText);
                        }

                        var encrypted = msEncrypt.ToArray();
                        return Convert.ToBase64String(encrypted);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting data");
                throw;
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
            {
                return cipherText;
            }

            if (!_isProduction)
            {
                // In development, return as-is (might be plain text)
                return cipherText;
            }

            try
            {
                var cipherBytes = Convert.FromBase64String(cipherText);

                using (var aes = Aes.Create())
                {
                    // Derive key and IV from the encryption key
                    var key = DeriveKey(_encryptionKey, 32); // 32 bytes for AES-256
                    var iv = DeriveKey(_encryptionKey + "IV", 16); // 16 bytes for IV

                    aes.Key = key;
                    aes.IV = iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using (var decryptor = aes.CreateDecryptor())
                    using (var msDecrypt = new MemoryStream(cipherBytes))
                    using (var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    using (var srDecrypt = new StreamReader(csDecrypt))
                    {
                        return srDecrypt.ReadToEnd();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting data");
                throw;
            }
        }

        /// <summary>
        /// Derives a key of the specified length from a password using SHA256
        /// </summary>
        private byte[] DeriveKey(string password, int keyLength)
        {
            using (var sha256 = SHA256.Create())
            {
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                if (hash.Length >= keyLength)
                {
                    return hash.Take(keyLength).ToArray();
                }
                else
                {
                    // If hash is shorter, pad with repeated hash
                    var result = new byte[keyLength];
                    for (int i = 0; i < keyLength; i++)
                    {
                        result[i] = hash[i % hash.Length];
                    }
                    return result;
                }
            }
        }
    }
}
