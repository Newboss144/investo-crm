// Central TypeScript interfaces for INVESTO CRM

export type UserRole = 'admin' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PolicyType = 'lic' | 'health' | 'general' | 'mutual_fund';
export type PolicyStatus = 'active' | 'expired' | 'lapsed' | 'pending';

export interface Policy {
  id: string;
  customerId: string;
  type: PolicyType;
  policyNo: string;
  provider: string;
  premium: number;
  investmentValue: number;
  status: PolicyStatus;
  maturityDate: string; // ISO date string
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 'aadhaar' | 'pan' | 'bank_proof' | 'other';

export interface KYCDocument {
  id: string;
  customerId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface SearchResult {
  objectID: string;
  type: 'customer' | 'policy';
  name?: string;
  phone?: string;
  email?: string;
  policyNo?: string;
  customerId?: string;
}

export interface CSVCustomerRow {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalPolicies: number;
  activePolicies: number;
  totalDocuments: number;
}
