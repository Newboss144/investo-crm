import Typesense from 'typesense';

// Typesense client for admin operations (used server-side only)
export const typesenseAdminClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108'),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY || 'xyz',
  connectionTimeoutSeconds: 2,
});

// Search-only client (safe for browser)
export const typesenseSearchClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108'),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || 'xyz',
  connectionTimeoutSeconds: 2,
});

export const CUSTOMERS_COLLECTION = 'customers';

export const customersSchema = {
  name: CUSTOMERS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'phone', type: 'string' as const },
    { name: 'email', type: 'string' as const },
    { name: 'agentId', type: 'string' as const },
  ],
  default_sorting_field: 'name',
};

export async function upsertCustomerInSearch(customer: {
  id: string;
  name: string;
  phone: string;
  email: string;
  agentId: string;
}) {
  try {
    await typesenseAdminClient
      .collections(CUSTOMERS_COLLECTION)
      .documents()
      .upsert({ ...customer });
  } catch {
    // Silently fail if Typesense not available
  }
}

export async function deleteCustomerFromSearch(id: string) {
  try {
    await typesenseAdminClient
      .collections(CUSTOMERS_COLLECTION)
      .documents(id)
      .delete();
  } catch {
    // Silently fail
  }
}

export async function searchCustomers(query: string, agentId: string) {
  try {
    const results = await typesenseSearchClient
      .collections(CUSTOMERS_COLLECTION)
      .documents()
      .search({
        q: query,
        query_by: 'name,phone,email',
        filter_by: `agentId:=${agentId}`,
        per_page: 10,
        typo_tokens_threshold: 1,
      });
    return results.hits ?? [];
  } catch {
    return [];
  }
}
