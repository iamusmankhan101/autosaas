import Dexie, { type EntityTable } from 'dexie';

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  total_udhaar: number;
  created_at: number;
  updated_at: number;
}

export interface JobService {
  id: string;
  name: string;
  price: number;
}

export interface JobCard {
  id: string; // UUID
  customer_id: string;
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
  amount: number;
  type: 'CREDIT' | 'PAYMENT'; // Credit = Udhaar taken, Payment = Udhaar cleared
  description: string;
  created_at: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'TIRE' | 'OIL' | 'PART';
  quantity: number;
  unit: 'PIECE' | 'LITER';
  alert_threshold: number;
  vendor_id?: string;
  created_at: number;
}

export interface Vendor {
  id: string;
  name: string; // e.g., Bilal Gunj Parts
  phone: string;
  udhaar_owed: number; // Udhaar we owe to them
}

export interface WorkflowTask {
  id: string;
  job_id: string;
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
  default_price: number;
  category: string;
  created_at: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string; // e.g. "Mechanic", "Helper", "Electrician"
  active: boolean;
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
};

// Schema declaration:
db.version(1).stores({
  customers: 'id, name, phone', 
  jobs: 'id, customer_id, license_plate, status',
  transactions: 'id, customer_id, type'
});

// Phase 2 Schema Upgrade:
db.version(2).stores({
  customers: 'id, name, phone', // Redefined for the version scope
  jobs: 'id, customer_id, license_plate, status, bay_assignment',
  transactions: 'id, customer_id, type',
  inventory: 'id, category, vendor_id',
  vendors: 'id, name'
});

// Phase 3: Workflow Tasks
db.version(3).stores({
  customers: 'id, name, phone',
  jobs: 'id, customer_id, license_plate, status, bay_assignment',
  transactions: 'id, customer_id, type',
  inventory: 'id, category, vendor_id',
  vendors: 'id, name',
  workflow_tasks: 'id, job_id, status, mechanic'
});

// Phase 4: Add created_at index to transactions for orderBy queries
db.version(4).stores({
  transactions: 'id, customer_id, type, created_at'
});

// Phase 5: Add created_at index to jobs for orderBy queries
db.version(5).stores({
  jobs: 'id, customer_id, license_plate, status, bay_assignment, created_at'
});

// Phase 6: Service catalog
db.version(6).stores({
  service_catalog: 'id, category, name'
});

// Phase 7: Add created_at index to workflow_tasks
db.version(7).stores({
  workflow_tasks: 'id, job_id, status, mechanic, created_at'
});

// Phase 8: Staff management
db.version(8).stores({
  staff: 'id, name, role, active'
});

export { db };
