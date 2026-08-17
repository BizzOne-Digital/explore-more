# Digital Book Storage Guide - Large Files (300MB+)

## 🎯 Problem
MongoDB has a **16MB document limit**, making it impossible to store large digital book files (300MB+) directly. We need cloud storage for digital downloads.

---

## ✅ RECOMMENDED SOLUTION: Cloudflare R2

### Why Cloudflare R2?
1. **FREE 10GB storage/month** (no egress fees!)
2. **S3-compatible API** - easy integration
3. **Fast global CDN** - instant downloads worldwide
4. **Secure signed URLs** - time-limited download links
5. **Cost-effective** - Only $0.015/GB/month after free tier
6. **No bandwidth charges** - Unlike S3 which charges for downloads

### Pricing Comparison:
| Service | Storage (per GB) | Download (per GB) | Free Tier |
|---------|------------------|-------------------|-----------|
| **Cloudflare R2** | $0.015/mo | **FREE** ✅ | 10GB storage |
| AWS S3 | $0.023/mo | $0.09 | 5GB storage, 20K requests |
| Google Cloud | $0.020/mo | $0.12 | 5GB storage |
| Azure Blob | $0.018/mo | $0.087 | None |

**Example Cost for 100GB of books:**
- R2: ~$1.35/month (90GB paid) + unlimited downloads
- S3: ~$2.30/month + $0.09 per GB downloaded = **expensive with traffic**

---

## 🚀 Implementation Guide

### Step 1: Setup Cloudflare R2

1. **Create Cloudflare Account** (free): https://dash.cloudflare.com/sign-up
2. **Create R2 Bucket**:
   - Go to R2 → Create bucket
   - Name: `explore-more-books` (or any name)
   - Location: Automatic (closest to your users)

3. **Get API Credentials**:
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Copy: `Access Key ID`, `Secret Access Key`, `Endpoint URL`

4. **Add to `.env.local`**:
```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=explore-more-books
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

### Step 2: Install AWS SDK (R2 is S3-compatible)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 3: Create R2 Storage Service

Create `src/lib/services/r2-storage.ts`

### Step 4: Update Book Model

Add digital file information to Book schema:
```typescript
digitalFile?: {
  enabled: boolean;
  r2Key: string;        // File path in R2
  fileName: string;     // Original filename
  fileSizeBytes: number;
  fileType: string;     // pdf, epub, mobi
  uploadedAt: Date;
}
```

### Step 5: Create Upload API Route

Create `src/app/api/admin/books/upload-digital/route.ts`

### Step 6: Create Download API Route

Create `src/app/api/books/download/[bookId]/route.ts`

---

## 📁 File Structure

```
src/
├── lib/
│   └── services/
│       └── r2-storage.ts          # R2 client & upload/download logic
├── app/
│   └── api/
│       ├── admin/
│       │   └── books/
│       │       └── upload-digital/
│       │           └── route.ts    # Admin upload endpoint
│       └── books/
│           └── download/
│               └── [bookId]/
│                   └── route.ts    # Secure download endpoint
└── models/
    └── Book.ts                     # Updated with digitalFile field
```

---

## 🔒 Security Features

### 1. Signed URLs (Time-Limited Downloads)
- Generate temporary download links (valid for 15 minutes)
- Links expire automatically
- Prevents unauthorized sharing

### 2. Purchase Verification
- Check if user purchased the book before generating download link
- Track download history in Order model
- Limit download attempts (e.g., 5 downloads per purchase)

### 3. Admin-Only Uploads
- Only administrators can upload digital files
- Validate file types (PDF, EPUB, MOBI)
- Virus scanning (optional, using ClamAV or similar)

---

## 🎯 User Flow

### Purchase & Download Flow:

1. **User browses books** → Sees "Digital Download" badge
2. **Adds to cart** → Proceeds to checkout
3. **Payment successful** → Order created with `paymentStatus: "paid"`
4. **Order confirmation email** → Includes download link
5. **User clicks download** → API verifies purchase
6. **Generate signed URL** → Temporary R2 link (15 min expiry)
7. **Browser downloads file** → Direct from R2 CDN (fast!)
8. **Track download** → Log download in database

### Admin Upload Flow:

1. **Admin creates/edits book** in admin panel
2. **Uploads digital file** (PDF, EPUB, MOBI) up to 500MB
3. **File uploaded to R2** with unique key
4. **Book updated** with digital file metadata
5. **Enable "Digital Download"** toggle
6. **Book published** → Available for purchase

---

## 📊 Database Schema Updates

### Book Model Addition:
```typescript
digitalFile?: {
  enabled: boolean;           // Is digital download available?
  r2Key: string;             // storage/books/uuid-filename.pdf
  fileName: string;          // "My Awesome Book.pdf"
  fileSizeBytes: number;     // 314572800 (300MB)
  fileType: "pdf" | "epub" | "mobi" | "zip";
  uploadedAt: Date;
}
```

### Order Model Addition:
```typescript
digitalDownloads?: Array<{
  bookId: ObjectId;
  downloadedAt?: Date;
  downloadCount: number;      // Track number of downloads
  maxDownloads: number;       // Default: 5
  expiresAt?: Date;          // Optional: 30 days after purchase
}>
```

---

## 🎨 Frontend Components

### Book Detail Page Updates:

```tsx
{book.digitalFile?.enabled && (
  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
    <h3 className="font-semibold text-blue-900">
      📥 Digital Download Available
    </h3>
    <p className="text-sm text-blue-700 mt-1">
      Get instant access to the digital version after purchase.
      Format: {book.digitalFile.fileType.toUpperCase()}
    </p>
  </div>
)}
```

### Order Confirmation Page:

```tsx
{order.items.map(item => (
  item.book.digitalFile?.enabled && (
    <a 
      href={`/api/books/download/${item.bookId}?orderId=${order._id}`}
      className="btn btn-primary"
    >
      📥 Download {item.book.digitalFile.fileName}
    </a>
  )
))}
```

---

## 💰 Cost Estimation

### Example: 50 Digital Books (300MB each = 15GB total)

**Cloudflare R2:**
- Storage: First 10GB free, then 5GB × $0.015 = **$0.075/month**
- Downloads: **FREE** (no egress fees)
- **Total: ~$0.08/month** 🎉

**AWS S3 (for comparison):**
- Storage: First 5GB free, then 10GB × $0.023 = $0.23/month
- Downloads: 100 customers × 300MB × $0.09/GB = ~$27/month
- **Total: ~$27.23/month** 💸

### Scale Example: 200 books, 1000 downloads/month (60GB storage)

**R2 Cost:**
- Storage: (60GB - 10GB free) × $0.015 = **$0.75/month**
- Downloads: **$0** (unlimited free)
- **Total: $0.75/month**

**S3 Cost:**
- Storage: ~$1.15/month
- Downloads: 1000 × 300MB × $0.09/GB = **~$270/month**
- **Total: ~$271/month**

**R2 saves you $270/month!** 🚀

---

## 🔄 Alternative Solutions

### Option 2: AWS S3 + CloudFront (More Complex)
**Pros:**
- Mature ecosystem
- Advanced features

**Cons:**
- More expensive (egress fees)
- More complex setup
- CloudFront required for fast delivery

### Option 3: Backblaze B2 (Budget Option)
**Pros:**
- $5/TB/month storage
- First 1GB free download/day
- S3-compatible

**Cons:**
- Bandwidth costs after 1GB/day
- Slower than R2/CloudFront

### Option 4: Self-Hosted with Wasabi
**Pros:**
- $6.99/TB/month flat rate
- No egress fees

**Cons:**
- Minimum $6.99/month commitment
- Less flexible than R2

### Option 5: Vercel Blob Storage
**Pros:**
- Easy integration with Next.js
- Simple API

**Cons:**
- Expensive: $0.15/GB storage + $0.30/GB bandwidth
- Not suitable for large files

---

## 🎯 Recommendation

**Use Cloudflare R2** - It's the perfect solution because:

1. ✅ **Completely FREE** for your initial scale (10GB)
2. ✅ **No surprise bandwidth bills** (unlimited downloads)
3. ✅ **Fast global delivery** (Cloudflare's CDN)
4. ✅ **S3-compatible** (standard tools work)
5. ✅ **Scales effortlessly** as you grow
6. ✅ **Simple setup** (30 minutes to implement)

**Start with R2, then migrate if needed** (unlikely!)

---

## 📝 Next Steps

1. ☐ Create Cloudflare account
2. ☐ Set up R2 bucket
3. ☐ Install AWS SDK packages
4. ☐ Create R2 storage service
5. ☐ Update Book model with digitalFile field
6. ☐ Create upload API route (admin)
7. ☐ Create download API route (customer)
8. ☐ Add UI components for admin upload
9. ☐ Add download button to order page
10. ☐ Test with sample 300MB file

---

## 🆘 Support Resources

- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- S3 Presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html

---

## 🔐 Security Checklist

- [ ] Enable R2 bucket CORS for your domain only
- [ ] Use signed URLs with 15-minute expiry
- [ ] Verify purchase before generating download link
- [ ] Limit downloads per purchase (e.g., 5 times)
- [ ] Log all download attempts
- [ ] Rate limit download endpoint
- [ ] Set proper file type validation
- [ ] Consider adding watermarking for PDFs
- [ ] Implement download expiry (30 days after purchase)
- [ ] Add virus scanning for uploaded files (optional)
