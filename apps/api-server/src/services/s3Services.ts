// apps/api-server/src/services/s3Services.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

// Load .env from the api-server root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});
// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Validate environment variables
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID?.trim();
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const AWS_REGION = process.env.AWS_REGION?.trim() || "ap-south-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET?.trim();

// Log for debugging (remove in production)
console.log("🔍 AWS Configuration Check:");
console.log("AWS_REGION:", AWS_REGION);
console.log(
  "AWS_ACCESS_KEY_ID:",
  AWS_ACCESS_KEY_ID
    ? `✅ Present (${AWS_ACCESS_KEY_ID.substring(0, 4)}...)`
    : "❌ Missing",
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  AWS_SECRET_ACCESS_KEY ? "✅ Present" : "❌ Missing",
);
console.log("AWS_S3_BUCKET:", BUCKET_NAME || "❌ Missing");

// Validate credentials
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.error("❌ CRITICAL: AWS credentials are missing!");
  console.error("Please check your environment variables:");
  console.error("  - AWS_ACCESS_KEY_ID:", AWS_ACCESS_KEY_ID ? "✅" : "❌");
  console.error(
    "  - AWS_SECRET_ACCESS_KEY:",
    AWS_SECRET_ACCESS_KEY ? "✅" : "❌",
  );
  console.error("  - AWS_S3_BUCKET:", BUCKET_NAME || "❌");
  throw new Error(
    "AWS credentials are not properly configured. Please check your .env file.",
  );
}
export class S3Service {
  /**
   * Upload buffer directly to S3 (used by ImageUploadService)
   */
  static async uploadBuffer(buffer: Buffer, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: this.getContentType(key),
        // ACL: 'public-read',
        Metadata: {
          "uploaded-at": new Date().toISOString(),
        },
      });
      console.log(`📤 Uploading to S3: ${key}`);
      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
      console.log(`✅ Uploaded to S3: ${url}`);
      return url;
    } catch (error) {
      console.error("❌ Error uploading to S3:", error);
      throw error;
    }
  }

  /**
   * Upload file from filesystem to S3
   */
  static async uploadFile(
    filePath: string,
    folder: string = "repairs",
  ): Promise<string> {
    try {
      const fileContent = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      const ext = path.extname(filename);
      const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: this.getContentType(key),
        // ACL: 'public-read',
        Metadata: {
          "uploaded-at": new Date().toISOString(),
          "original-filename": filename,
        },
      });

      console.log(`📤 Uploading to S3 2: ${key}`);
      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
      console.log(`✅ File uploaded to S3: ${url}`);
      return url;
    } catch (error) {
      console.error("❌ Error uploading to S3:", error);
      throw error;
    }
  }
  static async uploadFileAsImage(
    filePath: string,
    folder: string = "repairs",
    type: "before" | "during" | "after" = "before",
  ): Promise<{ url: string; publicId: string; type: string }> {
    try {
      const fileContent = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      const ext = path.extname(filename);

      // Generate a unique public ID (without extension)
      const publicId = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const key = `${folder}/${publicId}${ext}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: this.getContentType(key),
        Metadata: {
          "uploaded-at": new Date().toISOString(),
          "original-filename": filename,
        },
      });

      console.log(`📤 Uploading image to S3: ${key}`);
      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
      console.log(`✅ Image uploaded to S3: ${url}`);

      // ✅ Return as RepairImage object
      return {
        url: url,
        publicId: publicId,
        type: type,
      };
    } catch (error) {
      console.error("❌ Error uploading image to S3:", error);
      throw error;
    }
  }

  /**
   * Upload multiple files to S3
   */
  static async uploadMultipleFiles(
    filePaths: string[],
    folder: string = "repairs",
  ): Promise<string[]> {
    const urls: string[] = [];

    for (const filePath of filePaths) {
      const url = await this.uploadFile(filePath, folder);
      urls.push(url);
    }

    return urls;
  }
  static async uploadMultipleFilesAsImages(
    filePaths: string[],
    folder: string = "repairs",
    type: "before" | "during" | "after" = "before",
  ): Promise<Array<{ url: string; publicId: string; type: string }>> {
    const images: Array<{ url: string; publicId: string; type: string }> = [];

    for (const filePath of filePaths) {
      const image = await this.uploadFileAsImage(filePath, folder, type);
      images.push(image);
    }

    return images;
  }
  /**
   * Delete file from S3 by key
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      console.log(`✅ Deleted from S3: ${key}`);
    } catch (error) {
      console.error("❌ Error deleting from S3:", error);
      throw error;
    }
  }

  /**
   * Delete file from S3 by URL (extracts key from URL)
   */
  static async deleteByUrl(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      // https://bucket.s3.region.amazonaws.com/folder/filename.jpg -> folder/filename.jpg
      const urlParts = fileUrl.split(".amazonaws.com/");
      if (urlParts.length === 2) {
        const key = urlParts[1];
        await this.deleteFile(key);
      }
    } catch (error) {
      console.error("❌ Error deleting by URL:", error);
      throw error;
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  static async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("❌ Error generating presigned URL:", error);
      throw error;
    }
  }

  /**
   * Get content type from file extension
   */
  private static getContentType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    const types: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".heic": "image/heic",
      ".heif": "image/heif",
    };
    return types[ext] || "application/octet-stream";
  }
}
