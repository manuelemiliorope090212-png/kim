const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (file, folder = 'memories') => {
  return new Promise((resolve, reject) => {
    // Configuración especial para archivos de audio
    const options = {
      folder,
      resource_type: 'auto' // Permite detectar automáticamente el tipo de archivo
    };

    // Si es carpeta de música, especificar que es audio
    if (folder === 'manuel-music') {
      options.resource_type = 'video'; // Cloudinary trata audio como video
    }

    cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(file);
  });
};

module.exports = { uploadToCloudinary };