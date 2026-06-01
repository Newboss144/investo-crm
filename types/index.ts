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
export type PolicyStatus = 'active' | 'lapsed' | 'matured' | 'pending';
export type ModeOfPayment = 'yearly' | 'half_yearly' | 'quarterly' | 'monthly';

export interface Policy {
  id: string;
  customerId: string;
  type: PolicyType;
  policyNo: string;
  premium: number;
  sumAssured: number;         // Sum Assured for Health & General Insurance
  investmentValue: number;    // Investment Value for Mutual Fund
  status: PolicyStatus;
  maturityDate: string;       // ISO date string – LIC only
  doc: string;                // Date of Commencement – ISO date string
  planTerm: string;           // e.g. "856-15-26" (planNo-PPT-term)
  modeOfPayment: ModeOfPayment;
  isECS: boolean;             // Auto-Debit / ECS flag
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
