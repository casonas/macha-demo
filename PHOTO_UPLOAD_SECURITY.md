# Photo Upload Security Documentation

## Overview

The assessment platform allows users to attach up to **3 photos per question** to support their answers with visual evidence (e.g., photos of security cameras, access points, signage). This document outlines the current implementation, security constraints, and risks to consider before deploying to production.

## Current Implementation (Demo)

| Constraint       | Value                            |
|------------------|----------------------------------|
| Max photos       | 3 per question                   |
| Max file size    | 5 MB per file                    |
| Accepted types   | `image/jpeg`, `image/png`, `image/webp` |
| Storage          | In-memory (React state); not persisted to disk or server |

Photos are read client-side via `FileReader.readAsDataURL()` and stored as base64 data URLs in component state. They are **not** uploaded to any server or saved to localStorage in the current demo.

## Security Risks & Mitigations

### 1. Malicious File Upload
**Risk**: An attacker could rename a malicious file (e.g., an executable or script) with an image extension and upload it.

**Current Mitigation**: The `accept` attribute on the file input restricts selection to image MIME types, and the handler validates `file.type` against an allowlist (`image/jpeg`, `image/png`, `image/webp`).

**Production Recommendation**: Client-side validation alone is insufficient. In production:
- Validate MIME type **server-side** by inspecting file magic bytes (file signature), not just the `Content-Type` header.
- Re-encode uploaded images using a server-side imaging library (e.g., Sharp for Node.js) to strip any embedded payloads.
- Run antivirus/malware scanning on uploaded files before storing.

### 2. Cross-Site Scripting (XSS) via Image Metadata
**Risk**: Image files can contain EXIF metadata or SVG payloads that, if rendered unsafely, could execute JavaScript.

**Current Mitigation**: Only raster image types (JPEG, PNG, WebP) are accepted — SVG is excluded. Images are rendered via `<img>` tags with `src` set to a data URL, which does not execute scripts.

**Production Recommendation**:
- Strip EXIF/metadata from uploaded images server-side before storage.
- Never render user-uploaded SVGs or accept `image/svg+xml`.
- Set a strict `Content-Security-Policy` header that prevents inline script execution.

### 3. Denial of Service (DoS) via Large Files
**Risk**: Users could upload many large files to exhaust client memory or server storage/bandwidth.

**Current Mitigation**: Files are capped at 5 MB each, with a maximum of 3 per question. Total maximum payload per question is 15 MB.

**Production Recommendation**:
- Enforce file size limits server-side (do not rely solely on client-side checks).
- Set a global per-assessment upload quota (e.g., 100 MB total).
- Use streaming uploads with size checks to reject oversized files early.
- Rate-limit upload endpoints per user.

### 4. Storage of Sensitive/PII Data in Photos
**Risk**: Assessment photos may capture sensitive information — people's faces, badge numbers, building layouts, access codes visible on keypads, etc. This data is subject to privacy regulations (e.g., FERPA for schools, HIPAA for healthcare).

**Production Recommendation**:
- Inform users via a consent notice before photo upload that images may contain sensitive data.
- Store photos in an encrypted-at-rest storage service (e.g., AWS S3 with SSE, or Firebase Storage with security rules).
- Apply access controls so only authorized users can view uploaded photos.
- Implement a retention policy to automatically delete photos after a defined period.
- Consider stripping EXIF GPS data to remove geolocation information.

### 5. Data URL / Base64 Memory Bloat
**Risk**: Storing images as base64 data URLs in React state or localStorage inflates their size by ~33% and can cause performance degradation or localStorage quota exhaustion.

**Current Mitigation**: Photos are stored only in React component state (in-memory) and are not persisted to localStorage.

**Production Recommendation**:
- Upload files directly to a cloud storage service and store only the reference URL/ID in the application state.
- Use `URL.createObjectURL()` for client-side previews instead of `FileReader.readAsDataURL()` to reduce memory usage during the session.
- Implement lazy loading for photo thumbnails in the UI.

### 6. Man-in-the-Middle (MITM) During Upload
**Risk**: If photos are transmitted over an unencrypted connection, they could be intercepted.

**Production Recommendation**:
- Serve the application exclusively over HTTPS.
- Use signed upload URLs (e.g., Firebase Storage signed URLs, AWS S3 presigned URLs) to ensure uploads go directly to secure storage.

## Production Architecture Recommendation

```
Client                         Server / Cloud
┌─────────────┐     HTTPS      ┌──────────────────┐
│ File picker  │ ──────────────>│ Upload endpoint   │
│ (3 max, 5MB) │               │ • MIME validation  │
│              │               │ • Magic byte check │
│ Preview via  │               │ • Re-encode image  │
│ createObjURL │               │ • Strip EXIF       │
└─────────────┘               │ • Virus scan       │
                               └────────┬─────────┘
                                        │
                               ┌────────▼─────────┐
                               │ Encrypted Storage │
                               │ (S3 / Firebase)   │
                               │ • Access controls  │
                               │ • Retention policy │
                               └──────────────────┘
```

## Summary

The current demo implementation is safe for local/demo use — photos never leave the browser. Before deploying photo uploads to production, implement server-side validation, secure storage, access controls, and the additional mitigations described above.
