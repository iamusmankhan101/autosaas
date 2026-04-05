import Dexie, { type EntityTable } from 'dexie';

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  total_udhaar: number;
  location_id?: string; // Optional for migration
  created_at: number;
  updated_at: number;
}

export interface JobService {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface JobCard {
  id: string; // UUID
  customer_id: string;
  location_id: string;
  vehicle_make: string;   // Suzuki, Honda
  vehicle_model: string;  // Alto, Civic
  license_plate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  services?: JobService[];
  total_amount: number;
  advance_paid: number;
  thumbnails?: string[]; // Base64 compressed strings
  bay_assignment?: string; // e.g. "Bay 1", "Lift 2"
  scheduled_time?: number; // Epoch target
  created_at: number;
  updated_at: number;
}

export interface KhataTransaction {
  id: string; // UUID
  customer_id: string;
  location_id: string;
  amount: number;
  type: 'CREDIT' | 'PAYMENT'; // Credit = Udhaar taken, Payment = Udhaar cleared
  description: string;
  created_at: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  location_id: string;
  category: 'TIRE' | 'OIL' | 'PART';
  quantity: number;
  unit: 'PIECE' | 'LITER';
  price: number; // Added in v13
  alert_threshold: number;
  vendor_id?: string;
  created_at: number;
}

export interface Vendor {
  id: string;
  name: string; // e.g., Bilal Gunj Parts
  phone: string;
  location_id: string;
  udhaar_owed: number; // Udhaar we owe to them
}

export interface WorkflowTask {
  id: string;
  job_id: string;
  location_id: string;
  title: string;
  mechanic: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: number;
  updated_at: number;
}

export interface ServiceCatalog {
  id: string;
  name: string;
  location_id: string;
  default_price: number;
  category: string;
  created_at: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  location_id: string;
  role: string; // e.g. "Mechanic", "Helper", "Electrician"
  active: boolean;
  created_at: number;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  color?: string;
  vin?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;   // e.g. INV-0001
  job_id: string;
  customer_id: string;
  location_id: string;
  staff_id?: string;        // Added in v16
  staff_name?: string;      // Added in v16
  vehicle_id?: string;      // Added in v16
  customer_name: string;
  customer_phone: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  services: JobService[];
  total_amount: number;
  advance_paid: number;
  balance: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  notes?: string;
  created_at: number;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: number;
}

export interface Setting {
  key: string;
  value: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Local hashed pass placeholder
  workshop_name?: string;
  isAdmin: boolean;
  created_at: number;
}

const db = new Dexie('MistryAppDB') as Dexie & {
  customers: EntityTable<Customer, 'id'>;
  jobs: EntityTable<JobCard, 'id'>;
  transactions: EntityTable<KhataTransaction, 'id'>;
  inventory: EntityTable<InventoryItem, 'id'>;
  vendors: EntityTable<Vendor, 'id'>;
  workflow_tasks: EntityTable<WorkflowTask, 'id'>;
  service_catalog: EntityTable<ServiceCatalog, 'id'>;
  staff: EntityTable<StaffMember, 'id'>;
  vehicles: EntityTable<Vehicle, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
  locations: EntityTable<Location, 'id'>;
  settings: EntityTable<Setting, 'key'>;
  users: EntityTable<User, 'id'>;
};

// ... existing versions ...

// Phase 12: Global Settings
db.version(12).stores({
  settings: 'key',
  locations: 'id, name',
  customers: 'id, name, phone, location_id',
  jobs: 'id, customer_id, location_id, license_plate, status, created_at',
  transactions: 'id, customer_id, location_id, type, created_at',
  inventory: 'id, location_id, category, vendor_id',
  vendors: 'id, location_id, name',
  workflow_tasks: 'id, job_id, location_id, status, created_at',
  service_catalog: 'id, location_id, category, name',
  staff: 'id, location_id, name, role, active',
  invoices: 'id, job_id, customer_id, location_id, status, created_at'
});

// Phase 13: Inventory Price Support
db.version(13).stores({
  settings: 'key',
  locations: 'id, name',
  customers: 'id, name, phone, location_id',
  jobs: 'id, customer_id, location_id, license_plate, status, created_at',
  transactions: 'id, customer_id, location_id, type, created_at',
  inventory: 'id, location_id, category, vendor_id, price',
  vendors: 'id, location_id, name',
  workflow_tasks: 'id, job_id, location_id, status, created_at',
  service_catalog: 'id, location_id, category, name',
  staff: 'id, location_id, name, role, active',
  invoices: 'id, job_id, customer_id, location_id, status, created_at'
});

// Phase 14: Adding Vehicles table to schema
db.version(14).stores({
  settings: 'key',
  locations: 'id, name',
  customers: 'id, name, phone, location_id',
  jobs: 'id, customer_id, location_id, license_plate, status, created_at',
  transactions: 'id, customer_id, location_id, type, created_at',
  inventory: 'id, location_id, category, vendor_id, price',
  vendors: 'id, location_id, name',
  workflow_tasks: 'id, job_id, location_id, status, created_at',
  service_catalog: 'id, location_id, category, name',
  staff: 'id, location_id, name, role, active',
  invoices: 'id, job_id, customer_id, location_id, status, created_at',
  vehicles: 'id, customer_id, license_plate'
});

// Phase 15: Authentication Support
db.version(15).stores({
  settings: 'key',
  locations: 'id, name',
  customers: 'id, name, phone, location_id',
  jobs: 'id, customer_id, location_id, license_plate, status, created_at',
  transactions: 'id, customer_id, location_id, type, created_at',
  inventory: 'id, location_id, category, vendor_id, price',
  vendors: 'id, location_id, name',
  workflow_tasks: 'id, job_id, location_id, status, created_at',
  service_catalog: 'id, location_id, category, name',
  staff: 'id, location_id, name, role, active',
  invoices: 'id, job_id, customer_id, location_id, status, created_at',
  vehicles: 'id, customer_id, license_plate',
  users: 'id, email'
});

// Phase 16: POS Staff & Vehicle Tracking
db.version(16).stores({
  settings: 'key',
  locations: 'id, name',
  customers: 'id, name, phone, location_id',
  jobs: 'id, customer_id, location_id, license_plate, status, created_at',
  transactions: 'id, customer_id, location_id, type, created_at',
  inventory: 'id, location_id, category, vendor_id, price',
  vendors: 'id, location_id, name',
  workflow_tasks: 'id, job_id, location_id, status, created_at',
  service_catalog: 'id, location_id, category, name',
  staff: 'id, location_id, name, role, active',
  invoices: 'id, job_id, customer_id, location_id, status, created_at',
  vehicles: 'id, customer_id, license_plate',
  users: 'id, email'
});

export { db };
