using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;

namespace SmartTermin.Services
{
    public class CloudinaryImageStorageService : IImageStorageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryImageStorageService(IConfiguration configuration)
        {
            var cloudinarySettings = configuration.GetSection("CloudinarySettings");
            var cloudName = cloudinarySettings["CloudName"];
            var apiKey = cloudinarySettings["ApiKey"];
            var apiSecret = cloudinarySettings["ApiSecret"];

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(Stream imageStream, string fileName)
        {
            // Create eager transformation to optimize image during upload
            // This will create and store optimized WebP versions
            var eagerTransformation = new Transformation()
                .FetchFormat("auto") // Auto format: WebP if supported, fallback to original
                .Quality("auto:good") // Automatic quality optimization (good balance)
                .Flags("progressive"); // Progressive loading for better perceived performance

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, imageStream),
                Folder = "smarttermin/portfolio",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false,
                // Apply eager transformations to optimize images during upload
                // This creates optimized versions that are stored in Cloudinary
                EagerTransforms = new List<Transformation> { eagerTransformation }
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                // Return the optimized URL (eager transformation URL if available, otherwise original)
                // Cloudinary will automatically serve the optimized version
                var optimizedUrl = uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString() ?? string.Empty;
                
                // Apply transformation to the URL to ensure WebP format is used
                // Cloudinary will serve WebP if supported by the browser
                if (!string.IsNullOrEmpty(optimizedUrl))
                {
                    // Insert transformation parameters into the URL
                    optimizedUrl = optimizedUrl.Replace("/upload/", "/upload/f_auto,q_auto:good,fl_progressive/");
                }
                
                return optimizedUrl;
            }

            throw new Exception($"Failed to upload image to Cloudinary: {uploadResult.Error?.Message}");
        }
    }
}

