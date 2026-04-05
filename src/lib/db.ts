import Dexie, { type EntityTable } from 'dexie';

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  total_udhaar: number;
  created_at: number;
  updated_at: number;
}

export interface JobCard {
  id: string; // UUID
  customer_id: string;
  vehicle_make: string;   // Suzuki, Honda
  vehicle_model: string;  // Alto, Civic
  license_plate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
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

const db = new Dexie('MistryAppDB') as Dexie & {
  customers: EntityTable<Customer, 'id'>;
  jobs: EntityTable<JobCard, 'id'>;
  transactions: EntityTable<KhataTransaction, 'id'>;
  inventory: EntityTable<InventoryItem, 'id'>;
  vendors: EntityTable<Vendor, 'id'>;
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

export { db };
