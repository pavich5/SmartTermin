namespace SmartTermin.Services
{
    /// <summary>
    /// Service for encrypting and decrypting API responses
    /// </summary>
    public interface IEncryptionService
    {
        /// <summary>
        /// Encrypts a string value
        /// </summary>
        string Encrypt(string plainText);

        /// <summary>
        /// Decrypts an encrypted string value
        /// </summary>
        string Decrypt(string cipherText);

        /// <summary>
        /// Checks if encryption is enabled (production mode)
        /// </summary>
        bool IsEncryptionEnabled();
    }
}
