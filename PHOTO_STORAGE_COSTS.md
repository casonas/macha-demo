# Firebase Photo Storage Cost Breakdown

## Overview

This document provides a cost analysis for storing assessment photos using **Firebase Cloud Storage** (powered by Google Cloud Storage).

---

## Firebase Storage Pricing (Pay-as-you-go — Blaze Plan)

| Resource | Free Tier (per month) | Cost After Free Tier |
|---|---|---|
| Storage | 5 GB | $0.026 / GB / month |
| Download bandwidth | 1 GB / day | $0.12 / GB |
| Upload operations | 20,000 / day | $0.05 / 10,000 operations |
| Download operations | 50,000 / day | $0.004 / 10,000 operations |

---

## Assumptions

| Parameter | Value |
|---|---|
| Average photo size | 2 MB (compressed JPEG) |
| Photos per assessment | 20 |
| Assessments per user per month | 4 |
| Number of active users | 50 |
| Report views per assessment (downloads) | 3 |

---

## Monthly Cost Estimate

### Storage

- Photos per month: 50 users x 4 assessments x 20 photos = **4,000 photos**
- Storage added per month: 4,000 x 2 MB = **8 GB**
- Cumulative storage after 12 months: ~96 GB

| Month | Cumulative Storage | Monthly Storage Cost |
|---|---|---|
| 1 | 8 GB | $0.08 |
| 3 | 24 GB | $0.49 |
| 6 | 48 GB | $1.12 |
| 12 | 96 GB | $2.37 |

*First 5 GB free each month.*

### Upload Operations

- 4,000 uploads/month
- Free tier: 20,000/day (well within limits)
- **Cost: $0.00**

### Download Bandwidth

- Downloads per month: 4,000 photos x 3 views x 2 MB = **24 GB**
- Free tier: 1 GB/day = ~30 GB/month
- Within free tier for most months
- **Cost: $0.00** (within free tier)

### Download Operations

- 4,000 x 3 = 12,000 operations/month
- Free tier: 50,000/day
- **Cost: $0.00**

---

## Monthly Cost Summary

| Cost Category | Month 1 | Month 6 | Month 12 |
|---|---|---|---|
| Storage | $0.08 | $1.12 | $2.37 |
| Uploads | $0.00 | $0.00 | $0.00 |
| Downloads | $0.00 | $0.00 | $0.00 |
| **Total** | **$0.08** | **$1.12** | **$2.37** |

---

## Scaling Scenarios

### 100 Active Users

| Month | Storage | Monthly Cost |
|---|---|---|
| 1 | 16 GB | $0.29 |
| 6 | 96 GB | $2.37 |
| 12 | 192 GB | $4.86 |

### 500 Active Users

| Month | Storage | Monthly Cost |
|---|---|---|
| 1 | 80 GB | $1.95 |
| 6 | 480 GB | $12.35 |
| 12 | 960 GB | $24.83 |

---

## Cost Optimization Strategies

1. **Image compression** — Compress photos client-side before upload (target 500 KB–1 MB). This can reduce storage costs by 50–75%.

2. **Lifecycle policies** — Automatically delete or archive photos older than a set period (e.g., move to Coldline storage after 90 days at $0.004/GB/month).

3. **Thumbnail generation** — Store thumbnails for list views and load full-resolution only on demand.

4. **CDN caching** — Firebase Storage uses Google's CDN by default, reducing repeated download costs.

5. **Storage limits per user** — Set per-user quotas via Firebase Security Rules to prevent abuse.

---

## Firebase Security Rules for Photo Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assessments/{userId}/{assessmentId}/{allPaths=**} {
      // Only the owner can read/write their own photos
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Limit file size to 10 MB
      allow write: if request.resource.size < 10 * 1024 * 1024;
      // Only allow image types
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Conclusion

Firebase Storage is very cost-effective for photo storage in this application. At 50 users, monthly costs remain under **$3/month** even after a full year of use. The free tier covers most upload and download operations. The primary cost driver is cumulative storage, which grows linearly with usage but remains affordable even at scale.
