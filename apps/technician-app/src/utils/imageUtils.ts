// apps/technician-app/src/utils/imageUtils.ts

// Helper to get image URL (works with both local and S3)
export const getImageUrl = (imageUrl: string): string => {
  // If it's already a full URL (S3), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path, prepend base URL
  const baseUrl = process.env.API_URL || 'http://192.168.137.1:5000';
  return `${baseUrl}${imageUrl}`;
};

// Helper to check if image is from S3
export const isS3Image = (url: string): boolean => {
  return url.includes('.s3.') || url.includes('amazonaws.com');
};

// Helper to get image filename from URL
export const getImageFilename = (url: string): string => {
  return url.split('/').pop() || '';
};