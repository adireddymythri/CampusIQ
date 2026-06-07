const { v2: cloudinary } = require('cloudinary')
const { env } = require('../config/env')
const fs = require('fs')
const path = require('path')

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })
}

function isConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
}

async function uploadToCloudinary(file) {
  if (!isConfigured()) {
    // Fallback to local storage in development/without Cloudinary
    const uploadDir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    // Clean original filename to prevent directory traversal or weird character issues
    const cleanBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${cleanBaseName}-${uniqueSuffix}${ext}`
    const filepath = path.join(uploadDir, filename)

    fs.writeFileSync(filepath, file.buffer)

    const port = env.PORT || 8080
    const fileUrl = `http://localhost:${port}/uploads/${filename}`

    return {
      url: fileUrl,
      secure_url: fileUrl,
      publicId: filename,
      public_id: filename,
      bytes: file.size || file.buffer.length,
      format: ext.replace('.', '') || 'bin',
    }
  }

  const base64 = file.buffer.toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64}`

  const isPdf = (file.mimetype || '').includes('pdf') || (file.originalname || '').toLowerCase().endsWith('.pdf')

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: 'studyhub/notes',
    resource_type: isPdf ? 'raw' : 'auto',
    filename_override: file.originalname,
    use_filename: true,
    unique_filename: true,
  })

  return {
    url: uploaded.secure_url,
    secure_url: uploaded.secure_url,
    publicId: uploaded.public_id,
    public_id: uploaded.public_id,
    bytes: uploaded.bytes,
    format: uploaded.format,
  }
}

module.exports = { uploadToCloudinary }

