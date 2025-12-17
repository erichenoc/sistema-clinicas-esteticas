'use client'

/**
 * Cloudinary Upload Utility
 * Uses unsigned upload with preset for client-side uploads
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dbftvu8ab'
const UPLOAD_PRESET = 'ml_default' // Unsigned upload preset

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
}

export interface UploadOptions {
  folder?: string
  tags?: string[]
  transformation?: string
}

/**
 * Upload a file to Cloudinary using unsigned upload
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  if (options.folder) {
    formData.append('folder', options.folder)
  }

  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','))
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Error uploading to Cloudinary')
  }

  return response.json()
}

/**
 * Upload a base64 image to Cloudinary
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', base64Data)
  formData.append('upload_preset', UPLOAD_PRESET)

  if (options.folder) {
    formData.append('folder', options.folder)
  }

  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','))
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Error uploading to Cloudinary')
  }

  return response.json()
}

/**
 * Generate a thumbnail URL from a Cloudinary URL
 */
export function getCloudinaryThumbnail(
  url: string,
  width: number = 200,
  height: number = 200
): string {
  if (!url.includes('cloudinary.com')) {
    return url
  }

  // Insert transformation before the version/public_id
  const parts = url.split('/upload/')
  if (parts.length !== 2) {
    return url
  }

  return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto/${parts[1]}`
}

/**
 * Delete an image from Cloudinary (requires server-side implementation)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  // This needs to be done server-side with API key/secret
  // For now, we'll call a server action
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  })

  return response.ok
}
