import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Customer, Policy, KYCDocument } from '@/types';

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createCustomer(
  data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'customers'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'customers', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'customers', id));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const snap = await getDoc(doc(db, 'customers', id));
  if (!snap.exists()) return null;
  return firestoreToCustomer(snap);
}

export async function getCustomers(
  agentId: string,
  pageSize = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ customers: Customer[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, 'customers'),
    where('agentId', '==', agentId),
    orderBy('updatedAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  const customers = snap.docs.map(firestoreToCustomer);
  const last = snap.docs[snap.docs.length - 1] ?? null;
  return { customers, lastDoc: last };
}

function firestoreToCustomer(snap: DocumentSnapshot): Customer {
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    address: d.address,
    notes: d.notes,
    agentId: d.agentId,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (d.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export async function createPolicy(
  data: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'policies'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePolicy(
  id: string,
  data: Partial<Omit<Policy, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'policies', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePolicy(id: string): Promise<void> {
  await deleteDoc(doc(db, 'policies', id));
}

export async function getPoliciesByCustomer(customerId: string): Promise<Policy[]> {
  const q = query(
    collection(db, 'policies'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (d.data().updatedAt as Timestamp)?.toDate() ?? new Date(),
  })) as Policy[];
}

export async function getAllPoliciesForAgent(agentId: string): Promise<Policy[]> {
  // Get all customers for agent first, then their policies
  const custSnap = await getDocs(
    query(collection(db, 'customers'), where('agentId', '==', agentId))
  );
  const customerIds = custSnap.docs.map((d) => d.id);
  if (customerIds.length === 0) return [];

  // Firestore 'in' queries support up to 30 items
  const chunks = [];
  for (let i = 0; i < customerIds.length; i += 30) {
    chunks.push(customerIds.slice(i, i + 30));
  }

  const allPolicies: Policy[] = [];
  for (const chunk of chunks) {
    const snap = await getDocs(
      query(collection(db, 'policies'), where('customerId', 'in', chunk))
    );
    snap.docs.forEach((d) =>
      allPolicies.push({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
        updatedAt: (d.data().updatedAt as Timestamp)?.toDate() ?? new Date(),
      } as Policy)
    );
  }
  return allPolicies;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(
  data: Omit<KYCDocument, 'id' | 'uploadedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'documents'), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDoc(doc(db, 'documents', id));
}

export async function getDocumentsByCustomer(customerId: string): Promise<KYCDocument[]> {
  const q = query(
    collection(db, 'documents'),
    where('customerId', '==', customerId),
    orderBy('uploadedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: (d.data().uploadedAt as Timestamp)?.toDate() ?? new Date(),
  })) as KYCDocument[];
}
