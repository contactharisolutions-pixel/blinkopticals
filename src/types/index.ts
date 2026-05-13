export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'manager';
  avatar?: string;
  business_id?: string;
}

export interface Business {
  business_id: string;
  business_name: string;
  owner_name: string;
  email: string;
  logo_url?: string;
  favicon_url?: string;
  active_status: boolean;
  gstin_main?: string;
  pan_no?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mobile_number?: string;
  subscription_tier?: string;
  social_links?: any;
}

export interface Showroom {
  showroom_id: string;
  business_id: string;
  showroom_name: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  contact_number: string;
  secondary_contact?: string;
  manager_name: string;
  active_status: boolean;
  gstin?: string;
  email?: string;
  google_maps_link?: string;
  map_location_link?: string;
  staff_count?: number;
  total_stock?: number;
}
