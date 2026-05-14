/**
 * storage.js — Supabase Storage helpers for article images
 */
import { supabase } from "./supabase";

const BUCKET = "article-images";
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export function validateImage(file) {
  if (!file) return "No file selected.";
  if (!ALLOWED_TYPES.includes(file.type))
    return `Invalid file type. Allowed: JPG, PNG, WebP, GIF.`;
  if (file.size > MAX_SIZE_BYTES)
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  return null;
}

/**
 * Upload an image file to Supabase Storage.
 * Returns { url, path, error }.
 * Calls onProgress(0–100) during upload.
 */
export async function uploadArticleImage(file, onProgress) {
  const error = validateImage(file);
  if (error) return { url: null, path: null, error };

  const ext  = file.name.split(".").pop().toLowerCase();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `articles/${name}`;

  onProgress?.(10);

  const { data, error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadErr) return { url: null, path: null, error: uploadErr.message };

  onProgress?.(90);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  onProgress?.(100);

  return { url: urlData.publicUrl, path: data.path, error: null };
}

export async function deleteArticleImage(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message ?? null };
}
