// apps/api-server/src/controllers/repairController.ts
import { Request, Response } from "express";
import { RepairService } from "../services/repairService";
import { ImageUploadService } from "../services/imageUploadServices";
import { AIAutoFillService } from "../services/aiAutoFillService";

import { ImageOptimizationService } from "../services/imageOptimizationService";
import { uploadMultiple } from "../middleware/upload";
import path from "path";
import { S3Service } from "../services/s3Services";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const repairController = {
  // Create repair
  async createRepair(req: Request, res: Response) {
    try {
      uploadMultiple(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message || "File upload error",
          });
        }

        try {
          let repairData = req.body;

          // Parse device specs
          if (typeof repairData.deviceSpecs === "string") {
            repairData.deviceSpecs = JSON.parse(repairData.deviceSpecs);
          }

          // Set technician
          if (req.user?.role === "technician") {
            repairData.technicianId = req.user.id;
          }

          // Process uploaded images
          let images: Array<{ url: string; publicId: string; type: string }> = [];
          let imageUrls: string[] = [];
          const files = (req.files as Express.Multer.File[]) || [];

          if (files.length > 0) {
            const filePaths = files.map((file) => file.path);

            // Optimize images
            const optimizedPaths =
              await ImageOptimizationService.optimizeMultipleImages(filePaths);

            const useS3 = process.env.USE_S3 === "true";
            if (useS3) {
              console.log("☁️ Uploading to S3...");
              images = await S3Service.uploadMultipleFilesAsImages(
                optimizedPaths,
                "repairs",
                "before", // Default type, you can make this dynamic
              );
              console.log("✅ Uploaded to S3:", imageUrls);
            } else {
              console.log("💾 Using local storage...");
              const baseUrl = process.env.API_URL || "http://localhost:5000";
              imageUrls = optimizedPaths.map((filePath) => {
                const filename = path.basename(filePath);
                return `${baseUrl}/uploads/${filename}`;
              });
              console.log("✅ Local URLs:", imageUrls);
            }
          }

          // Add image URLs to repair data
          repairData.images = images;

          // Create repair
          const repair = await RepairService.createRepair(repairData);

          res.status(201).json({
            success: true,
            message: "Repair created successfully",
            data: repair,
          });
        } catch (error: any) {
          console.error("Error creating repair:", error);
          res.status(400).json({
            success: false,
            message: error.message || "Failed to create repair",
          });
        }
      });
    } catch (error: any) {
      console.error("Error in createRepair:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Add image optimization endpoint (optional)
  async optimizeExistingImages(req: Request, res: Response) {
    try {
      const { filePaths } = req.body;

      if (!filePaths || !Array.isArray(filePaths)) {
        return res.status(400).json({
          success: false,
          message: "File paths array is required",
        });
      }

      const optimized =
        await ImageOptimizationService.optimizeMultipleImages(filePaths);

      const results = optimized.map((path, index) => ({
        original: filePaths[index],
        optimized: path,
        sizeMB: ImageOptimizationService.getFileSize(path),
      }));

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to optimize images",
      });
    }
  },

  // async autoFillFromImages(req: Request, res: Response) {
  //   try {
  //     const { images } = req.body;
  //     if (!images || images.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "At least one image is required",
  //       });
  //     }

  //     const aiService = new AIAutoFillService();

  //     // Upload images first if they are base64
  //     let imageUrls = images;
  //     if (images[0].startsWith("data:image")) {
  //       imageUrls = await ImageUploadService.uploadImages(images, "temp");
  //     }

  //     // Analyze images with AI
  //     const extractedData = await aiService.analyzeMultipleImages(imageUrls);

  //     res.json({
  //       success: true,
  //       data: extractedData,
  //     });
  //   } catch (error: any) {
  //     console.error("Error auto-filling from images:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || "Failed to analyze images",
  //     });
  //   }
  // },
  // async autoFillFromImages(req: Request, res: Response) {
  //   try {
  //     const { images } = req.body;

  //     if (!images || !Array.isArray(images) || images.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'At least one image is required',
  //       });
  //     }

  //     console.log(`📸 Analyzing ${images.length} images for auto-fill...`);

  //     // ✅ STEP 5: Call AI service
  //     const aiService = new AIAutoFillService();
  //     const extractedData = await aiService.analyzeMultipleImages(images);
  //     console.log('✅ AI analysis complete:', extractedData);
  //     // ✅ STEP 6: Return extracted data
  //     return res.status(200).json({
  //       success: true,
  //       data: extractedData,
  //     });

  //   } catch (error: any) {
  //     console.error('❌ Error in autoFillRepair:', error);
  //     return res.status(500).json({
  //       success: false,
  //       message: error.message || 'Failed to analyze images',
  //     });
  //   }
  // },
  // apps/api-server/src/controllers/repairController.ts

 async autoFillFromImages(req: Request, res: Response) {
  try {
    const { images, deviceType } = req.body; // ✅ Get deviceType from request

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    console.log(`📸 Analyzing ${images.length} images for device type: ${deviceType || 'auto'}`);

    const aiService = new AIAutoFillService();
    
    // ✅ Pass device type to the service
    const extractedData = await aiService.analyzeMultipleImages(images, deviceType);

    return res.status(200).json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    console.error('❌ Error in autoFillRepair:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze images',
    });
  }
},

  // Get all repairs
  async getRepairs(req: Request, res: Response) {
    try {
      const {
        technicianId,
        customerId,
        deviceType,
        status,
        priority,
        startDate,
        endDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await RepairService.getRepairs({
        technicianId: technicianId as string,
        customerId: customerId as string,
        deviceType: deviceType as string,
        status: status as string,
        priority: priority as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("Error fetching repairs:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch repairs",
      });
    }
  },

  // Get repair by ID
  async getRepairById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const repair = await RepairService.getRepairById(id);

      if (!repair) {
        return res.status(404).json({
          success: false,
          message: "Repair not found",
        });
      }

      res.json({
        success: true,
        data: repair,
      });
    } catch (error: any) {
      console.error("Error fetching repair:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch repair",
      });
    }
  },

  // Update repair
  async updateRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const repair = await RepairService.updateRepair(id, updateData);

      if (!repair) {
        return res.status(404).json({
          success: false,
          message: "Repair not found",
        });
      }

      res.json({
        success: true,
        message: "Repair updated successfully",
        data: repair,
      });
    } catch (error: any) {
      console.error("Error updating repair:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update repair",
      });
    }
  },

  // Update repair status
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const repair = await RepairService.updateStatus(id, status, notes);

      if (!repair) {
        return res.status(404).json({
          success: false,
          message: "Repair not found",
        });
      }

      res.json({
        success: true,
        message: `Repair status updated to ${status}`,
        data: repair,
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  },

  // Delete repair
  async deleteRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await RepairService.deleteRepair(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error deleting repair:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete repair",
      });
    }
  },

  // Get technician stats
  async getTechnicianStats(req: Request, res: Response) {
    try {
      const { technicianId } = req.params;

      if (!technicianId) {
        return res.status(400).json({
          success: false,
          message: "Technician ID is required",
        });
      }

      const stats = await RepairService.getTechnicianStats(technicianId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error fetching technician stats:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch technician stats",
      });
    }
  },

  // Get repair stats (overall)
  async getRepairStats(req: Request, res: Response) {
    try {
      const { technicianId, customerId, deviceType } = req.query;

      const filter: any = {};
      if (technicianId) filter.technicianId = technicianId;
      if (customerId) filter.customerId = customerId;
      if (deviceType) filter.deviceType = deviceType;

      const stats = await RepairService.getRepairStats(filter);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error fetching repair stats:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch repair stats",
      });
    }
  },
};
