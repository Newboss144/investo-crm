import { supabase } from './supabase';

export async function uploadDocument(
  customerId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `${customerId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      // @ts-ignore - support older/newer types for onUploadProgress if any
      onUploadProgress: (progress) => {
        if (progress.total) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          onProgress?.(pct);
        }
      },
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(path);

  return publicUrl;
}

export async function deleteStorageFile(fileUrl: string): Promise<void> {
  try {
    const bucketMarker = '/documents/';
    const index = fileUrl.indexOf(bucketMarker);
    if (index === -1) return;
    const path = decodeURIComponent(fileUrl.substring(index + bucketMarker.length));

    await supabase.storage.from('documents').remove([path]);
  } catch {
    // If file doesn't exist, silently ignore
  }
}

export async function getSignedViewUrl(fileUrl: string): Promise<string> {
  try {
    const bucketMarker = '/documents/';
    const index = fileUrl.indexOf(bucketMarker);
    if (index === -1) return fileUrl;
    const path = decodeURIComponent(fileUrl.substring(index + bucketMarker.length));

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 300); // 5 minutes expiry

    if (error || !data) {
      console.warn('Failed to create signed URL, falling back to public URL:', error);
      return fileUrl;
    }
    return data.signedUrl;
  } catch {
    return fileUrl;
  }
}
