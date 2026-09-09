// apps/technician-app/src/services/CustomerService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./apicall";
// import { authApi } from './apicall';

const CUSTOMERS_KEY = "technician_customers";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  notes?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

class CustomerService {
  private static instance: CustomerService;
  private useApi: boolean = true; // Set to false to use AsyncStorage only

  static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  // Get all customers
  async getMyCustomers(): Promise<Customer[]> {
    try {
      // console.log("Fetching customers for technician...");
      // If API is enabled, try to fetch from backend
      if (this.useApi) {
        // console.log("Fetching customers via API...");
        try {
          // const response = await authApi.getCustomers();
          // console.log("Fetching customers via API...");
          const response = await api.get("users/getMyCustomers");
          // console.log("getMyCustomers",response);
          if (response.data.success) {
            // Cache customers locally
            // await this.cacheCustomers(response.data.data);
            return response.data.data;
          }
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to local storage:",
            apiError,
          );
          // Fallback to local storage
          return this.getLocalCustomers();
        }
      }

      // Use local storage
      console.log("Fetching customers from local storage...");
      return this.getLocalCustomers();
    } catch (error) {
      console.error("Error getting customers:", error);
      return [];
    }
  }

  // Get customers from local storage
  async getLocalCustomers(): Promise<Customer[]> {
    try {
      const data = await AsyncStorage.getItem(CUSTOMERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting local customers:", error);
      return [];
    }
  }

  // Cache customers in local storage
  async cacheCustomers(customers: Customer[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error("Error caching customers:", error);
    }
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      if (this.useApi) {
        try {
          const response = await api.get(`/users/getcustomers/${id}`);
          if (response.data.success) {
            return response.data.data;
          }
        } catch (apiError) {
          console.warn(
            "API fetch failed, falling back to local storage:",
            apiError,
          );
        }
      }

      // Fallback to local storage
      const customers = await this.getLocalCustomers();
      return customers.find((c) => c.id === id) || null;
    } catch (error) {
      console.error("Error getting customer by ID:", error);
      return null;
    }
  }

  // Get customer by phone
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      if (this.useApi) {
        try {
          // Search API for customer by phone
          const response = await api.get(`/users/getcustomers`);
          if (response.data.success) {
            const customer = response.data.data.find(
              (c: Customer) => c.phone === phone,
            );
            if (customer) return customer;
          }
        } catch (apiError) {
          console.warn(
            "API search failed, falling back to local storage:",
            apiError,
          );
        }
      }

      // Fallback to local storage
      const customers = await this.getLocalCustomers();
      return customers.find((c) => c.phone === phone) || null;
    } catch (error) {
      console.error("Error getting customer by phone:", error);
      return null;
    }
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      if (this.useApi && query.trim().length >= 2) {
        console.log("Searching customers via API for query:", query);

        try {
          const response = await api.get(
            `/users/getCustomers/search?q=${encodeURIComponent(query.trim())}`,
          );

          if (response.data.success) {
            await this.cacheCustomers(response.data.data);
            return response.data.data;
          }
        } catch (apiError) {
          console.warn(
            "API search failed, falling back to local storage:",
            apiError,
          );
        }
      }

      // Fallback to local search
      const customers = await this.getLocalCustomers();
      const searchLower = query.toLowerCase();
      return customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.phone.includes(query) ||
          (c.email && c.email.toLowerCase().includes(searchLower)) ||
          (c.address && c.address.toLowerCase().includes(searchLower)),
      );
    } catch (error) {
      console.error("Error searching customers:", error);
      return [];
    }
  }

  // Create a new customer
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      // Check if customer already exists by phone
      const existing = await this.getCustomerByPhone(data.phone);
      if (existing) {
        throw new Error(`Customer with phone ${data.phone} already exists`);
      }

      const newCustomer: Customer = {
        ...data,
        id: Date.now().toString(),
        role: "customer",
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try to save to API
      if (this.useApi) {
        try {
          const response = await api.post("/customers", {
            name: data.name,
            phone: data.phone,
            email: data.email || `${data.phone}@temp.customer.com`,
          });

          if (response.data.success) {
            // Update local cache
            const customers = await this.getLocalCustomers();
            const apiCustomer = {
              ...response.data.data,
              address: data.address,
              notes: data.notes,
            };
            customers.push(apiCustomer);
            await this.cacheCustomers(customers);
            return apiCustomer;
          }
        } catch (apiError) {
          console.warn(
            "API creation failed, saving to local storage:",
            apiError,
          );
        }
      }

      // Fallback: Save to local storage
      const customers = await this.getLocalCustomers();
      customers.push(newCustomer);
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      return newCustomer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  // Save customer (create or update)
  async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      if (this.useApi) {
        try {
          if (customer.id && !customer.id.startsWith("temp_")) {
            // Update existing customer
            const response = await api.put(
              `/customers/${customer.id}`,
              customer,
            );
            if (response.data.success) {
              // Update local cache
              const customers = await this.getLocalCustomers();
              const index = customers.findIndex((c) => c.id === customer.id);
              if (index >= 0) {
                customers[index] = response.data.data;
              } else {
                customers.push(response.data.data);
              }
              await this.cacheCustomers(customers);
              return response.data.data;
            }
          } else {
            // Create new customer
            return this.createCustomer(customer);
          }
        } catch (apiError) {
          console.warn("API save failed, saving to local storage:", apiError);
        }
      }

      // Fallback: Save to local storage
      const customers = await this.getLocalCustomers();
      const existingIndex = customers.findIndex((c) => c.id === customer.id);

      if (existingIndex >= 0) {
        customers[existingIndex] = {
          ...customer,
          updatedAt: new Date().toISOString(),
        };
      } else {
        customers.push({
          ...customer,
          id: customer.id || Date.now().toString(),
          createdAt: customer.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      return customer;
    } catch (error) {
      console.error("Error saving customer:", error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(
    id: string,
    updates: Partial<Customer>,
  ): Promise<Customer | null> {
    try {
      if (this.useApi) {
        try {
          const response = await api.put(`/customers/${id}`, updates);
          if (response.data.success) {
            // Update local cache
            const customers = await this.getLocalCustomers();
            const index = customers.findIndex((c) => c.id === id);
            if (index >= 0) {
              customers[index] = { ...customers[index], ...response.data.data };
              await this.cacheCustomers(customers);
            }
            return response.data.data;
          }
        } catch (apiError) {
          console.warn("API update failed, updating local storage:", apiError);
        }
      }

      // Fallback: Update local storage
      const customers = await this.getLocalCustomers();
      const index = customers.findIndex((c) => c.id === id);

      if (index === -1) return null;

      customers[index] = {
        ...customers[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      return customers[index];
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  // Add customer (alias for create)
  async addCustomer(
    customerData: Omit<Customer, "id" | "createdAt">,
  ): Promise<Customer> {
    return this.createCustomer(customerData);
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      if (this.useApi) {
        try {
          const response = await api.delete(`/customers/${id}`);
          if (response.data.success) {
            // Remove from local cache
            const customers = await this.getLocalCustomers();
            const filtered = customers.filter((c) => c.id !== id);
            await this.cacheCustomers(filtered);
            return;
          }
        } catch (apiError) {
          console.warn(
            "API delete failed, deleting from local storage:",
            apiError,
          );
        }
      }

      // Fallback: Delete from local storage
      const customers = await this.getLocalCustomers();
      const filtered = customers.filter((c) => c.id !== id);
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }

  // Sync local customers with API
  async syncCustomers(): Promise<void> {
    try {
      if (this.useApi) {
        const response = await api.get("/customers");
        if (response.data.success) {
          await this.cacheCustomers(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error syncing customers:", error);
    }
  }

  // Get customers with pagination
  async getCustomersPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (this.useApi) {
        try {
          const response = await api.get("/customers", {
            params: {
              page,
              limit,
              search: search || undefined,
            },
          });
          if (response.data.success) {
            return {
              customers: response.data.data,
              total: response.data.total,
              page: response.data.page,
              limit: response.data.limit,
              totalPages: response.data.totalPages,
            };
          }
        } catch (apiError) {
          console.warn("API pagination failed, using local storage:", apiError);
        }
      }

      // Fallback: Local pagination
      const customers = await this.getLocalCustomers();
      const filtered = search
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.includes(search),
          )
        : customers;

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        customers: paginated,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      };
    } catch (error) {
      console.error("Error getting paginated customers:", error);
      return {
        customers: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }
  }

  // Set API mode
  setApiMode(useApi: boolean): void {
    this.useApi = useApi;
  }

  // Clear local cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CUSTOMERS_KEY);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }
}

// Export singleton instance
export default CustomerService.getInstance();

// Also export class for static usage (backward compatibility)
export { CustomerService as CustomerServiceClass };
