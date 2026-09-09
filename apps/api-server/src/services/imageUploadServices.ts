// apps/api-server/src/services/imageUploadService.ts
import * as fs from 'fs';
import * as path from 'path';
import { S3Service } from './s3Services';

export class ImageUploadService {
  
  /**
   * 
   * Upload multiple images (supports base64, URLs, and file paths)
   */
  static async uploadImages(images: string[], folder: string = 'repairs'): Promise<string[]> {
    try {
      console.log(`📤 Uploading ${images.length} images to ${folder}...`);
      
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`🔄 Processing image ${i + 1}/${images.length}`);
        
        let url: string;
        
        // Check if image is base64
        if (image.startsWith('data:image')) {
          url = await this.uploadBase64Image(image, folder);
        } 
        // Check if it's already a URL
        else if (image.startsWith('http://') || image.startsWith('https://')) {
          url = image; // Already uploaded
        } 
        // It's a local file path
        else {
          url = await this.uploadFile(image, folder);
        }
        
        uploadedUrls.push(url);
        console.log(`✅ Image ${i + 1} uploaded: ${url}`);
      }
      
      console.log(`✅ All ${uploadedUrls.length} images uploaded successfully`);
      return uploadedUrls;
      
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      throw error;
    }
  }

  /**
   * Upload single base64 image
   */
  static async uploadBase64Image(base64Image: string, folder: string = 'repairs'): Promise<string> {
    try {
      // Extract base64 data and type
      const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
      
      if (!matches) {
        throw new Error('Invalid base64 image format');
      }
      
      const extension = matches[1] || 'jpg';
      const base64Data = matches[2];
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const { v4: uuidv4 } = await import('uuid');
      const filename = `${uuidv4()}.${extension}`;
      const relativePath = `${folder}/${filename}`;
      
      // Check if using S3
      const useS3 = process.env.USE_S3 === 'true';
      
      if (useS3) {
        // ✅ Upload to S3 using uploadBuffer
        console.log(`☁️ Uploading ${filename} to S3...`);
        const s3Url = await S3Service.uploadBuffer(buffer, relativePath);
        return s3Url;
      }
      
      // Save locally
      const uploadDir = path.join(__dirname, '../../uploads');
      const fullPath = path.join(uploadDir, relativePath);
      const dir = path.dirname(fullPath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(fullPath, buffer);
      
      // Return URL
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      const url = `${baseUrl}/uploads/${relativePath}`;
      
      console.log(`💾 Image saved locally: ${url}`);
      return url;
      
    } catch (error) {
      console.error('❌ Error uploading base64 image:', error);
      throw error;
    }
  }

  /**
   * Upload file from filesystem
   */
  static async uploadFile(filePath: string, folder: string = 'repairs'): Promise<string> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read file
      const buffer = fs.readFileSync(filePath);
      const originalName = path.basename(filePath);
      const ext = path.extname(originalName) || '.jpg';
      
      // Generate unique filename
      const { v4: uuidv4 } = await import('uuid');
      const filename = `${uuidv4()}${ext}`;
      const relativePath = `${folder}/${filename}`;
      
      // Check if using S3
      const useS3 = process.env.USE_S3 === 'true';
      
      if (useS3) {
        // ✅ Upload to S3 using uploadBuffer
        console.log(`☁️ Uploading ${filename} to S3...`);
        const s3Url = await S3Service.uploadBuffer(buffer, relativePath);
        return s3Url;
      }
      
      // Save locally
      const uploadDir = path.join(__dirname, '../../uploads');
      const fullPath = path.join(uploadDir, relativePath);
      const dir = path.dirname(fullPath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(filePath, fullPath);
      
      // Return URL
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      const url = `${baseUrl}/uploads/${relativePath}`;
      
      console.log(`💾 File saved locally: ${url}`);
      return url;
      
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files from filesystem
   */
  static async uploadMultipleFiles(filePaths: string[], folder: string = 'repairs'): Promise<string[]> {
    const urls: string[] = [];
    
    for (const filePath of filePaths) {
      const url = await this.uploadFile(filePath, folder);
      urls.push(url);
    }
    
    return urls;
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Check if using S3
      const useS3 = process.env.USE_S3 === 'true';
      
      if (useS3) {
        // ✅ Delete from S3 using deleteByUrl
        await S3Service.deleteByUrl(imageUrl);
        console.log(`🗑️ Deleted from S3: ${imageUrl}`);
        return;
      }
      
      // Delete locally
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      const relativePath = imageUrl.replace(`${baseUrl}/uploads/`, '');
      const uploadDir = path.join(__dirname, '../../uploads');
      const fullPath = path.join(uploadDir, relativePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted locally: ${fullPath}`);
      }
      
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteImages(imageUrls: string[]): Promise<void> {
    for (const url of imageUrls) {
      await this.deleteImage(url);
    }
  }

  /**
   * Get image file path (for local storage)
   */
  static getLocalPath(imageUrl: string): string {
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const relativePath = imageUrl.replace(`${baseUrl}/uploads/`, '');
    return path.join(__dirname, '../../uploads', relativePath);
  }

  /**
   * Check if image exists (local storage)
   */
  static imageExists(imageUrl: string): boolean {
    try {
      const filePath = this.getLocalPath(imageUrl);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Get image size (local storage)
   */
  static getImageSize(imageUrl: string): number {
    try {
      const filePath = this.getLocalPath(imageUrl);
      const stats = fs.statSync(filePath);
      return stats.size / (1024 * 1024); // Size in MB
    } catch {
      return 0;
    }
  }
}