import { supabase } from './supabase';

export async function searchCustomers(queryText: string, agentId: string) {
  if (!queryText.trim()) return [];

  try {
    // 1. Search customers directly by name, phone, email
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('agent_id', agentId)
      .or(`name.ilike.%${queryText}%,phone.ilike.%${queryText}%,email.ilike.%${queryText}%`)
      .limit(10);

    if (custError) throw custError;

    // 2. Search policies by policy number (only for customers of this agent)
    const { data: policyCustomers, error: polError } = await supabase
      .from('policies')
      .select(`
        id,
        policy_no,
        provider,
        type,
        customers!inner (
          id,
          name,
          phone,
          email,
          agent_id
        )
      `)
      .eq('customers.agent_id', agentId)
      .ilike('policy_no', `%${queryText}%`)
      .limit(10);

    if (polError) throw polError;

    const customerHits = (customers || []).map((c) => ({
      document: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
      },
    }));

    const policyHits = (policyCustomers || []).map((p: any) => ({
      document: {
        id: p.customers.id,
        name: `${p.customers.name} (Policy: ${p.policy_no})`,
        phone: p.customers.phone,
        email: p.customers.email || '',
      },
    }));

    // Combine results, removing duplicates
    const combined = [...customerHits];
    const seenIds = new Set(combined.map((h) => h.document.id));

    for (const hit of policyHits) {
      if (!seenIds.has(hit.document.id)) {
        combined.push(hit);
        seenIds.add(hit.document.id);
      }
    }

    return combined.slice(0, 10);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

// No-ops since Supabase/PostgreSQL index is updated automatically
export async function upsertCustomerInSearch(customer: any) {
  return Promise.resolve();
}

export async function deleteCustomerFromSearch(id: string) {
  return Promise.resolve();
}
