# Scalable E-Commerce Backend & Storefront

A scalable, high-performance E-Commerce Backend API built with Node.js, Express.js, MongoDB (Mongoose), Redis caching, and BullMQ background queue processing, featuring a React frontend storefront.

---

## Environment Variables Configuration

Copy `.env.example` to `.env` in the project root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Credentials for Product Image Uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Running the Application

### 1. Backend Server
```bash
npm install
npm start
# or for development
npm run dev
```

### 2. Frontend Storefront
```bash
cd frontend
npm install
npm run dev
```

### 3. Automated Tests
```bash
npm test
```

---

## Product Image Uploads (Cloudinary Integration)

Administrator endpoints support `multipart/form-data` uploads for product images:

### Endpoints
- **Create Product:** `POST /api/v1/products` (Requires Admin Auth)
- **Update Product:** `PATCH /api/v1/products/:id` (Requires Admin Auth)

### Postman Testing Instructions
1. Set HTTP Method to `POST` or `PATCH`.
2. Enter URL: `http://localhost:5000/api/v1/products` (or with `:id`).
3. Set **Headers**:
   - `Authorization: Bearer <ADMIN_JWT_TOKEN>`
4. Go to **Body** tab and select **form-data**:
   - `name`: `Wireless Headphones` (Text)
   - `price`: `199.99` (Text)
   - `category`: `Electronics` (Text)
   - `description`: `Noise-canceling over-ear headphones` (Text)
   - `stock`: `25` (Text)
   - `image`: Select type **File** and upload a JPEG, PNG, or WebP image file (max 5 MB).

### Image Replacement & Deletion Behavior
- When replacing a product image via `PATCH /api/v1/products/:id`, the new image is uploaded to Cloudinary first. Once the MongoDB update completes successfully, the old Cloudinary image is deleted using its `publicId`.
- If database operations fail, the newly uploaded image is safely removed from Cloudinary to prevent orphaned files.
- Deleting a product (`DELETE /api/v1/products/:id`) automatically deletes the associated image from Cloudinary.
