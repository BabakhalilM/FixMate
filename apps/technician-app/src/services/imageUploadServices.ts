

import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Option 1: Using Cloudinary (Free tier available)
import { v2 as cloudinary } from 'cloudinary';

// Option 2: Using local storage (for development)
const uploadToLocal = async (base64Image: string, folder: string = 'repairs'): Promise<string> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filename = `${folder}/${uuidv4()}.jpg`;
    const filepath = path.join(__dirname, '../../uploads', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error uploading to local:', error);
    throw error;
  }
};

// Option 3: Using Google Cloud Storage
// const storage = new Storage({
//   projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
//   credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
// });
// const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');

// Option 4: Using AWS S3
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
//   },
// });

export class ImageUploadService {
  
  // Upload multiple images
  static async uploadImages(images: string[], folder: string = 'repairs'): Promise<string[]> {
    try {
      const uploadedUrls: string[] = [];
      
      for (const image of images) {
        let url: string;
        
        // Check if it's base64 or URL
        if (image.startsWith('data:image')) {
          // It's base64, upload it
          url = await this.uploadBase64Image(image, folder);
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          // It's already a URL, use as is (or re-upload if needed)
          url = image;
        } else {
          // It's a local file path, upload it
          url = await this.uploadFile(image, folder);
        }
        
        uploadedUrls.push(url);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  // Upload single base64 image
  static async uploadBase64Image(base64Image: string, folder: string = 'repairs'): Promise<string> {
    try {
      // Clean the base64 string
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Detect image type
      const type = base64Image.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg';
      
      // Generate filename
      const filename = `${uuidv4()}.${type}`;
      const filepath = `${folder}/${filename}`;
      
      // For development: Save locally
      if (process.env.NODE_ENV === 'development') {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fullPath = path.join(uploadDir, filepath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, buffer);
        return `http://localhost:5000/uploads/${filepath}`;
      }
      
      // For production: Upload to Cloudinary
      // return await this.uploadToCloudinary(base64Image);
      
      // For production: Upload to Google Cloud Storage
      // return await this.uploadToGCS(buffer, filepath);
      
      return filepath;
    } catch (error) {
      console.error('Error uploading base64 image:', error);
      throw error;
    }
  }

  // Upload file from filesystem
  static async uploadFile(filePath: string, folder: string = 'repairs'): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      const filepath = `${folder}/${uuidv4()}-${filename}`;
      
      // For development: Copy to uploads folder
      if (process.env.NODE_ENV === 'development') {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fullPath = path.join(uploadDir, filepath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFileSync(filePath, fullPath);
        return `http://localhost:5000/uploads/${filepath}`;
      }
      
      return filepath;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Cloudinary upload
  static async uploadToCloudinary(base64Image: string): Promise<string> {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'repairs',
        resource_type: 'auto',
      });
      
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  // Google Cloud Storage upload
  // static async uploadToGCS(buffer: Buffer, filepath: string): Promise<string> {
  //   try {
  //     const blob = bucket.file(filepath);
  //     const blobStream = blob.createWriteStream({
  //       resumable: false,
  //     });
  //     
  //     return new Promise((resolve, reject) => {
  //       blobStream.on('error', (err) => {
  //         reject(err);
  //       });
  //       blobStream.on('finish', () => {
  //         const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
  //         resolve(publicUrl);
  //       });
  //       blobStream.end(buffer);
  //     });
  //   } catch (error) {
  //     console.error('Error uploading to GCS:', error);
  //     throw error;
  //   }
  // }
}