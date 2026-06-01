import { supabase } from './supabase';
import type { Customer, Policy, KYCDocument, DashboardStats } from '@/types';

// Helper: map DB snake_case to TS camelCase
export function dbToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    address: row.address || '',
    notes: row.notes || '',
    agentId: row.agent_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function dbToPolicy(row: any): Policy {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    policyNo: row.policy_no,
    premium: Number(row.premium) || 0,
    sumAssured: Number(row.sum_assured) || 0,
    investmentValue: Number(row.investment_value) || 0,
    status: row.status,
    maturityDate: row.maturity_date || '',
    doc: row.doc || '',
    planTerm: row.plan_term || '',
    modeOfPayment: row.mode_of_payment || 'yearly',
    isECS: row.is_ecs ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function dbToDocument(row: any): KYCDocument {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileSize: Number(row.file_size) || 0,
    uploadedAt: new Date(row.uploaded_at),
    uploadedBy: row.uploaded_by,
  };
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createCustomer(
  data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('customers')
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
      agent_id: data.agentId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'createdAt'>>
): Promise<void> {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.address !== undefined) payload.address = data.address;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.agentId !== undefined) payload.agent_id = data.agentId;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return dbToCustomer(data);
}

export async function getCustomers(
  agentId: string,
  pageSize = 20,
  lastIndex?: number
): Promise<{ customers: Customer[]; lastDoc: number | null }> {
  let q = supabase
    .from('customers')
    .select('*')
    .eq('agent_id', agentId)
    .order('updated_at', { ascending: false })
    .limit(pageSize);

  if (lastIndex !== undefined) {
    q = q.range(lastIndex + 1, lastIndex + pageSize);
  }

  const { data, error } = await q;
  if (error) throw error;

  const customers = (data || []).map(dbToCustomer);
  const nextIndex = data && data.length === pageSize ? (lastIndex || 0) + pageSize : null;
  return { customers, lastDoc: nextIndex as any };
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export async function createPolicy(
  data: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('policies')
    .insert({
      customer_id: data.customerId,
      type: data.type,
      policy_no: data.policyNo,
      premium: data.premium,
      sum_assured: data.sumAssured || 0,
      investment_value: data.investmentValue || 0,
      status: data.status,
      maturity_date: data.maturityDate || null,
      doc: data.doc || null,
      plan_term: data.planTerm || null,
      mode_of_payment: data.modeOfPayment || 'yearly',
      is_ecs: data.isECS ?? false,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function updatePolicy(
  id: string,
  data: Partial<Omit<Policy, 'id' | 'createdAt'>>
): Promise<void> {
  const payload: any = {};
  if (data.customerId !== undefined) payload.customer_id = data.customerId;
  if (data.type !== undefined) payload.type = data.type;
  if (data.policyNo !== undefined) payload.policy_no = data.policyNo;
  if (data.premium !== undefined) payload.premium = data.premium;
  if (data.sumAssured !== undefined) payload.sum_assured = data.sumAssured;
  if (data.investmentValue !== undefined) payload.investment_value = data.investmentValue;
  if (data.status !== undefined) payload.status = data.status;
  if (data.maturityDate !== undefined) payload.maturity_date = data.maturityDate || null;
  if (data.doc !== undefined) payload.doc = data.doc || null;
  if (data.planTerm !== undefined) payload.plan_term = data.planTerm || null;
  if (data.modeOfPayment !== undefined) payload.mode_of_payment = data.modeOfPayment;
  if (data.isECS !== undefined) payload.is_ecs = data.isECS;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('policies')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function deletePolicy(id: string): Promise<void> {
  const { error } = await supabase
    .from('policies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getPoliciesByCustomer(customerId: string): Promise<Policy[]> {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToPolicy);
}

export async function getAllPoliciesForAgent(agentId: string): Promise<(Policy & { customerName: string; customerPhone?: string })[]> {
  // Query policies for all customers owned by this agent
  const { data, error } = await supabase
    .from('policies')
    .select(`
      *,
      customers!inner (
        name,
        phone,
        agent_id
      )
    `)
    .eq('customers.agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...dbToPolicy(row),
    customerName: row.customers?.name || 'Unknown',
    customerPhone: row.customers?.phone || '',
  }));
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(
  data: Omit<KYCDocument, 'id' | 'uploadedAt'>
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('documents')
    .insert({
      customer_id: data.customerId,
      type: data.type,
      file_name: data.fileName,
      file_url: data.fileUrl,
      file_size: data.fileSize,
      uploaded_by: data.uploadedBy,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getDocumentsByCustomer(customerId: string): Promise<KYCDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('customer_id', customerId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToDocument);
}

export async function getAllDocumentsForAgent(
  agentId: string
): Promise<(KYCDocument & { customerName: string })[]> {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      customers!inner (
        name,
        agent_id
      )
    `)
    .eq('customers.agent_id', agentId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...dbToDocument(row),
    customerName: row.customers?.name || 'Unknown',
  }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDashboardStats(agentId: string): Promise<DashboardStats> {
  // 1. Get total customers count
  const { count: totalCustomers, error: errCust } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId);

  if (errCust) throw errCust;

  // 2. Get customer IDs for this agent
  const { data: customers, error: errCustIds } = await supabase
    .from('customers')
    .select('id')
    .eq('agent_id', agentId);

  if (errCustIds) throw errCustIds;
  const customerIds = (customers || []).map((c: any) => c.id);

  if (customerIds.length === 0) {
    return {
      totalCustomers: totalCustomers || 0,
      totalPolicies: 0,
      activePolicies: 0,
      totalDocuments: 0,
    };
  }

  // 3. Get total policies count for these customers
  const { count: totalPolicies, error: errPol } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .in('customer_id', customerIds);

  if (errPol) throw errPol;

  // 4. Get active policies count for these customers
  const { count: activePolicies, error: errActPol } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .in('customer_id', customerIds)
    .eq('status', 'active');

  if (errActPol) throw errActPol;

  // 5. Get total documents count for these customers
  const { count: totalDocuments, error: errDoc } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .in('customer_id', customerIds);

  if (errDoc) throw errDoc;

  return {
    totalCustomers: totalCustomers || 0,
    totalPolicies: totalPolicies || 0,
    activePolicies: activePolicies || 0,
    totalDocuments: totalDocuments || 0,
  };
}
