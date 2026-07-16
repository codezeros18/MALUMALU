import { addDocument } from './db';
import { appendEntry } from './hashchain';
import type { DocumentType, PetaniDocument } from '../types';

// Web Crypto API (bawaan browser) — bukan crypto-js — supaya lebih pas untuk file
// besar (foto/PDF) dan tanpa dependency baru. Hanya HASH yang dicatat, bukan isi file.
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Daftarkan dokumen: hitung hash file lokal → simpan metadata+hash (lib/db.ts,
// TANPA mengunggah file itu sendiri) → catat ke hash-chain sebagai bukti belum-diubah.
// File asli tidak pernah dikirim ke server pada fase ini (lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md, bagian "Dokumen Petani Terverifikasi").
export async function registerDocument(
  petaniId: string,
  type: DocumentType,
  file: File,
): Promise<PetaniDocument> {
  const fileHash = await hashFile(file);
  const doc = await addDocument({
    petaniId,
    type,
    fileName: file.name,
    fileHash,
    fileSizeBytes: file.size,
  });
  await appendEntry({
    type: 'document',
    petaniId,
    documentId: doc.id,
    documentType: type,
    fileHash,
  });
  return doc;
}
