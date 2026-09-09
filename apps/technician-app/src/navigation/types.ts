export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;

  Dashboard: undefined;
  TechnicianDashboard: undefined;
  Profile: undefined;
  Customers: undefined;
  CustomerDetail: {
    customerId: string;
  };
  CustomerSearch: undefined;
  Earnings: undefined;
  Inventory: undefined;
  Jobs: undefined;
  RepairHistory: undefined;
  RepairDetail: {
    repairId: string;
  };
  CustomerHistory: {
    customerId: string;
  }
  AddCustomer: undefined;
  Repairs: {
    statusFilter?: string;
  } | undefined;
  NewRepair: {
    existingCustomer?: object;
  };

  JobDetail: {
    repairId: string;
  };

  DeviceTypeManager: undefined;

  ServiceDetail: {
    serviceId: string;
  };

  // Profile
  // Profile: undefined;
  PersonalInfo: undefined;
  MyServices: undefined;
  Availability: undefined;
  Reviews: undefined;
  PaymentSettings: undefined;
  Notifications: undefined;
  Support: undefined;
  Privacy: undefined;
};