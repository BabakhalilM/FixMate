// apps/technician-app/src/services/RepairService.ts

import api from "./apicall";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Repair {
  _id: string;
  customerId: string;
  technicianId?: string;

  customerName: string;
  customerPhone: string;

  deviceType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;

  problemDescription: string;
  issueDescription?: string;

  status: "pending" | "in-progress" | "completed" | "cancelled";

  priority?: "low" | "medium" | "high" | "urgent";

  charges?: number;
  deposit?: number;

  estimatedDays?: string;
  estimatedCompletion?: Date;
  completedAt?: Date;

  notes?: string;

  deviceSpecs?: Record<string, any>;

  createdAt: string;
  updatedAt: string;

  images?: string[];
}

export interface CreateRepairData {
  customerId: string;
  customerName: string;
  customerPhone: string;

  deviceType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;

  problemDescription: string;

  status?: "pending" | "in-progress" | "completed" | "cancelled";

  priority?: "low" | "medium" | "high" | "urgent";

  charges?: number;
  deposit?: number;

  estimatedDays?: string;

  notes?: string;

  deviceSpecs?: Record<string, any>;
  images?: string[];
}

export interface RepairFilters {
  technicianId?: string;
  customerId?: string;
  deviceType?: string;
  status?: string;
  priority?: string;

  startDate?: string;
  endDate?: string;

  search?: string;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RepairStats {
  total: number;

  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;

  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;

  earnings: {
    totalEarnings: number;
    averageCharge: number;
    minCharge: number;
    maxCharge: number;
  };
}

export interface RepairListResponse {
  repairs: Repair[];

  total: number;
  page: number;
  limit: number;
  totalPages: number;

  stats: RepairStats;
}

// ─────────────────────────────────────────────
// Repair Service
// ─────────────────────────────────────────────

class RepairService {
  async autoFillRepairFromImages({ images, deviceType }: { images: string[]; deviceType?: string }) {
    try {
      console.log("Auto-filling repair from images:", { deviceType });
      const response = await api.post(
        "/repairs/auto-fil",
        { images, deviceType },
        {
          timeout: 60000, // 60 seconds timeout
          timeoutErrorMessage:
            "AI analysis is taking longer than expected. Please try again.",
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Error auto-filling from images:", error);
      throw new Error(
        error.response?.data?.message || "Failed to analyze images",
      );
    }
  }

  // ───────────────────────────────────────────
  // Create Repair
  // ───────────────────────────────────────────
  // async createRepair(formdata: FormData): Promise<Repair> {
  //   try {
  //     const response = await api.post("/repairs/create", formdata, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //       onUploadProgress: (progressEvent) => {
  //         const percentCompleted = Math.round(
  //           (progressEvent.loaded * 100) / (progressEvent.total || 100),
  //         );
  //         console.log(`Upload progress: ${percentCompleted}%`);
  //       },
  //     });
  //     if (response?.data?.success) {
  //       return response.data;
  //     }
  //     throw new Error(response?.data?.message || "Failed to create repair");
  //   } catch (error: any) {
  //     console.error("CREATE REPAIR ERROR:", error);
  //     throw new Error(
  //       error.response?.data?.message || "Failed to create repair",
  //     );
  //   }
  // }
  // apps/technician-app/src/services/RepairService.ts

  async createRepairWithImages(formData: FormData): Promise<Repair> {
    try {
      console.log("========== FORM DATA ==========");

      for (const [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(key, {
            name: (value as File).name,
            type: value.type,
            size: value.size,
          });
        } else {
          console.log(key, value);
        }
      }
      const response = await api.post("/repairs/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100),
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      // const response= {
      //   data:{
      //     _id:"1234567890987654321",
      //     success:true,
      //     data:{

      //     }
      //   }
      // }
      console.log(
        "response +++++++++++++++++++++++++++++____________",
        response,
      );
      if (response?.data?.success) {
        return response.data.data;
      }
      throw new Error(response?.data?.message || "Failed to create repair");
    } catch (error: any) {
      console.error("CREATE REPAIR ERROR:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create repair",
      );
    }
  }
  async createRepairWithBase64(data: CreateRepairData): Promise<Repair> {
    try {
      const response = await api.post("/repairs/create", data);
      if (response?.data?.success) {
        return response.data.data;
      }
      throw new Error(response?.data?.message || "Failed to create repair");
    } catch (error: any) {
      console.error("CREATE REPAIR ERROR:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create repair",
      );
    }
  }
  // ───────────────────────────────────────────
  // Get Repairs
  // ───────────────────────────────────────────
  async getRepairs(filters?: RepairFilters): Promise<RepairListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString();

      const url = queryString ? `/repairs?${queryString}` : "/repairs";

      console.log("Fetching repairs:", url);

      const response = await api.get(url);

      // console.log("Repairs response:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("GET REPAIRS ERROR:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch repairs",
      );
    }
  }
  // ───────────────────────────────────────────
  // Get Repair By ID
  // ───────────────────────────────────────────

  async getRepairById(id: string): Promise<Repair> {
    try {
      const response = await api.get(`/repairs/${id}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch repair",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Repairs By Customer
  // ───────────────────────────────────────────

  async getRepairsByCustomer(customerId: string): Promise<Repair[]> {
    try {
      const response = await api.get(`/repairs/customer/${customerId}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch customer repairs",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Repairs By Device Type
  // ───────────────────────────────────────────

  async getRepairsByDeviceType(deviceType: string): Promise<Repair[]> {
    try {
      const response = await api.get(`/repairs/device-type/${deviceType}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch repairs by device type",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Repairs By Status
  // ───────────────────────────────────────────

  async getRepairsByStatus(status: Repair["status"]): Promise<Repair[]> {
    try {
      const response = await api.get(`/repairs/status/${status}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch repairs by status",
      );
    }
  }

  // ───────────────────────────────────────────
  // Update Repair
  // ───────────────────────────────────────────

  async updateRepair(
    id: string,
    data: Partial<CreateRepairData>,
  ): Promise<Repair> {
    try {
      const response = await api.put(`/repairs/${id}`, data);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update repair",
      );
    }
  }

  // ───────────────────────────────────────────
  // Update Repair Status
  // ───────────────────────────────────────────

  async updateStatus(
    id: string,
    status: Repair["status"],
    notes?: string,
  ): Promise<Repair> {
    try {
      const response = await api.patch(`/repairs/${id}/status`, {
        status,
        notes,
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update repair status",
      );
    }
  }

  // ───────────────────────────────────────────
  // Update Repair Charges
  // ───────────────────────────────────────────

  async updateRepairCharges(id: string, charges: number): Promise<Repair> {
    try {
      const response = await api.patch(`/repairs/${id}/charges`, {
        charges,
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update repair charges",
      );
    }
  }

  // ───────────────────────────────────────────
  // Delete Repair
  // ───────────────────────────────────────────

  async deleteRepair(id: string): Promise<void> {
    try {
      await api.delete(`/repairs/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete repair",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Technician Statistics
  // ───────────────────────────────────────────

  async getTechnicianStats(
    technicianId: string,
  ): Promise<RepairStats & { monthly: any[] }> {
    try {
      const response = await api.get(
        `/repairs/technician/${technicianId}/stats`,
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch technician stats",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Repair Statistics
  // ───────────────────────────────────────────

  async getStats(filters?: {
    technicianId?: string;
    customerId?: string;
    deviceType?: string;
  }): Promise<RepairStats> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value);
          }
        });
      }

      const queryString = queryParams.toString();

      const response = await api.get(
        queryString ? `/repairs/stats?${queryString}` : "/repairs/stats",
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch repair statistics",
      );
    }
  }

  // ───────────────────────────────────────────
  // Search Repairs
  // ───────────────────────────────────────────

  async searchRepairs(query: string): Promise<Repair[]> {
    try {
      const response = await api.get("/repairs", {
        params: {
          search: query,
        },
      });

      return response.data.data ?? response.data.repairs ?? [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to search repairs",
      );
    }
  }

  // ───────────────────────────────────────────
  // Get Repairs By Date Range
  // ───────────────────────────────────────────

  async getRepairsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Repair[]> {
    try {
      const response = await api.get("/repairs", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      return response.data.data ?? response.data.repairs ?? [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch repairs by date range",
      );
    }
  }
}

// Export one service instance
export const repairService = new RepairService();

export default repairService;
