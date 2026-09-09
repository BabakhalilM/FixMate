// apps/api-server/src/services/imageOptimizationService.ts
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class ImageOptimizationService {
  
  static async optimizeImage(inputPath: string, outputPath?: string): Promise<string> {
    try {
      const ext = path.extname(inputPath);
      const dir = path.dirname(inputPath);
      const name = path.basename(inputPath, ext);
      
      // Create optimized version
      const optimizedPath = outputPath || path.join(dir, `${name}_optimized${ext}`);
      
      await sharp(inputPath)
        .resize(1200, 1200, { // Max dimensions
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(optimizedPath);
      
      // Replace original with optimized
      if (!outputPath) {
        fs.unlinkSync(inputPath);
        fs.renameSync(optimizedPath, inputPath);
        return inputPath;
      }
      
      return optimizedPath;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return inputPath;
    }
  }

  static async optimizeMultipleImages(filePaths: string[]): Promise<string[]> {
    const optimizedPaths: string[] = [];
    
    for (const filePath of filePaths) {
      const optimized = await this.optimizeImage(filePath);
      optimizedPaths.push(optimized);
    }
    
    return optimizedPaths;
  }

  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size / (1024 * 1024); // Size in MB
    } catch (error) {
      return 0;
    }
  }
}