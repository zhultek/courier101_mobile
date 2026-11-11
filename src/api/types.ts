import type { MobileAppearance } from '../theme/branding';

export interface CourierInfo {
  appearance?: MobileAppearance;
  code: string;
  courier_id: number;
  logo_url: string | null;
  // Absent until the API ships the flag; missing means enabled.
  delivery_enabled?: boolean;
}

export interface UserSettings {
  promotional_email: boolean;
  email_notification: boolean;
  package_update: boolean;
}

export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  street_address: string | null;
  city: string | null;
  parish: string | null;
  mobile_cell: string | null;
  pickup_location_id: number | null;
  pickup_location: string | null;
  mailbox: string;
  trn: string | null;
  settings: UserSettings;
  // Absent until the API ships the flag; missing means enabled.
  delivery_enabled?: boolean;
  created_at: string;
}

export interface Item {
  id: number;
  tracking_number: string;
  weight: number;
  description: string;
  sender: string;
  invoice_id: number | null;
  prealert?: 0 | 1;
  warehouse_code: string;
  location_id: number | null;
  location: string;
  total: number;
  status: string;
  created_at: string;
}

// Location rules: 1-3 = in transit, 4 = ready for pickup, 5 = shipped/delivered.
export function isInTransit(item: Pick<Item, 'location_id'>): boolean {
  return item.location_id != null && item.location_id >= 1 && item.location_id <= 3;
}

export interface FygaroPayment {
  url: string;
  total: number;
}

export interface DashboardData {
  fygaroPayment?: FygaroPayment | null;
  inTransit: number;
  totalShipped: number;
  accountBalance: number;
  pointsEnabled?: boolean;
  pointsBalance?: number | null;
  readyForPickupCount: number;
  readyForPickup: Item[];
  referralUrl?: string;
}

export interface TrackData {
  fygaroPayment?: FygaroPayment | null;
  inTransit: Item[];
  totalShipped: Item[];
  readyForPickup: Item[];
}

export interface Prealert {
  id: number;
  carrier: string;
  tracking_number: string;
  description: string;
  status_id: number;
  value: number;
  files: string;
  created_at: string;
}

export interface Delivery {
  id: number;
  location: string;
  first_name: string;
  last_name: string;
  mailbox: string;
  house_apt: string | null;
  street_address: string | null;
  latitude: string | null;
  longitude: string | null;
  parish: string | null;
  instruction: string | null;
  total: number;
  delivery_date: string;
  status: string;
  created_at: string;
  item_count: number;
  items?: Item[];
}

export interface InvoiceItem {
  quantity: number;
  invoice_id: number;
  total: number;
  product: string;
  /** 0 hides the fee row on invoices (mirrors product.show on the backend). */
  show?: 0 | 1;
  created_at: string;
}

/** Branding block for the courier that issued the invoice. */
export interface InvoiceCourier {
  name: string | null;
  street_address: string | null;
  city: string | null;
  parish: string | null;
  logo_url: string | null;
  gct_number: string | null;
  invoice_note: string | null;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  date: string | null;
  /** Package office arrival date (invoice.office_date on the server). */
  invoice_date?: string | null;
  total: number;
  status: string;
  weight_rate: number;
  created_at: string;
  payment_date: string | null;
  invoice_items: InvoiceItem[];
  /** The shipment this invoice bills. */
  item?: {
    id: number | null;
    tracking_number: string | null;
    warehouse_code: string | null;
    weight: number | null;
    description: string | null;
    amount: number | null;
  };
  customer?: {
    id: number | null;
    name: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    parish: string | null;
  };
  /** The customer's pickup-location address. */
  office?: {
    address: string | null;
    city: string | null;
    parish: string | null;
    country: string | null;
  };
  /** Absent until the API ships the courier branding block. */
  courier?: InvoiceCourier;
}

export interface ShippingAddress {
  name: string;
  address_type: 'us' | 'cn';
  address: string;
  address2: string;
  name_prefix: string | null;
  name_suffix: string | null;
  building: string | null;
  hide_address: boolean;
  note: string | null;
  city: string;
  state: string;
  zip: string;
  country: string | null;
}

export interface ShopForMe {
  id: number;
  name: string;
  value: number;
  quantity: number;
  product_link: string;
  weight: number;
  status_id?: number;
  cost?: number | null;
  service_charge?: number | null;
  created_at?: string;
}

export interface NamedOption {
  id: number;
  name: string;
}

export interface DeliveryLocation {
  id: number;
  name: string;
  rate: string;
  price_mobile: string;
  delivery_days: string[];
}

export interface Rate {
  id: number;
  rate: number;
  weight: number;
  currency: string;
}

export interface DutyCategory {
  id: number;
  name: string;
  duty: number;
  gct: number;
}

export interface CalculateResult {
  weight: number;
  stamp: string;
  caf: string;
  duty_cost: string;
  envl: string;
  scf: string;
  gct: string;
  freight_cost: string;
  customs_charge: string;
  grand_total: string;
}

export interface AuthorizedUser {
  id: number;
  first_name: string;
  last_name: string;
  id_type?: string | number;
  id_number?: string;
  created_at?: string;
}
