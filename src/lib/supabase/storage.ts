"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/env";

export type UploadResult = {
  url: string | null;
  path: string | null;
  error: string | null;
};

/**
 * Helper to convert a Base64 Data URL to a Blob
 */
function dataURItoBlob(dataURI: string): { blob: Blob; mimeType: string } {
  const parts = dataURI.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const base64Data = parts[1] || "";
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return { blob: new Blob([ab], { type: mimeType }), mimeType };
}

/**
 * Upload a financial receipt (Base64 string or File) to Supabase Storage 'receipts' bucket.
 * Returns the public CDN URL for the uploaded file.
 */
export async function uploadReceiptImage(
  fileOrBase64: File | string,
  organizationId?: string,
): Promise<UploadResult> {
  const config = getSupabaseConfig();
  if (!config) {
    // If Supabase is not configured (e.g. mock / test mode), return the base64 or object URL as fallback
    if (typeof fileOrBase64 === "string") {
      return { url: fileOrBase64, path: null, error: null };
    }
    return { url: URL.createObjectURL(fileOrBase64), path: null, error: null };
  }

  try {
    const supabase = createClient();
    let body: Blob | File;
    let extension = "jpg";
    let contentType = "image/jpeg";

    if (typeof fileOrBase64 === "string") {
      if (!fileOrBase64.startsWith("data:")) {
        // Already a remote URL (e.g. http:// or https://)
        return { url: fileOrBase64, path: null, error: null };
      }
      const { blob, mimeType } = dataURItoBlob(fileOrBase64);
      body = blob;
      contentType = mimeType;
      extension = mimeType.split("/")[1] || "jpg";
    } else {
      body = fileOrBase64;
      contentType = fileOrBase64.type || "image/jpeg";
      extension = fileOrBase64.name.split(".").pop() || "jpg";
    }

    const orgPrefix = organizationId ? organizationId.replace(/[^a-zA-Z0-9_-]/g, "") : "general";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${orgPrefix}/${timestamp}_${randomStr}.${extension}`;

    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(fileName, body, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload failed, using fallback:", error.message);
      // If upload fails, fallback to Base64/local URL so the user is never blocked
      return {
        url: typeof fileOrBase64 === "string" ? fileOrBase64 : null,
        path: null,
        error: error.message,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "파일 업로드 중 오류가 발생했습니다.";
    console.warn("Error uploading receipt:", message);
    return {
      url: typeof fileOrBase64 === "string" ? fileOrBase64 : null,
      path: null,
      error: message,
    };
  }
}

/**
 * Upload a general document/attachment to Supabase Storage 'attachments' bucket.
 */
export async function uploadAttachment(
  file: File,
  organizationId?: string,
): Promise<UploadResult> {
  const config = getSupabaseConfig();
  if (!config) {
    return { url: URL.createObjectURL(file), path: null, error: null };
  }

  try {
    const supabase = createClient();
    const orgPrefix = organizationId ? organizationId.replace(/[^a-zA-Z0-9_-]/g, "") : "general";
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${orgPrefix}/${timestamp}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return { url: null, path: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "첨부파일 업로드 중 오류가 발생했습니다.";
    return { url: null, path: null, error: message };
  }
}
