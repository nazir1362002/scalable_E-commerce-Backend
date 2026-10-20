# Wishlist API Documentation

All Wishlist endpoints require JWT Authentication (`Authorization: Bearer <token>`).

---

## Base URL
`/api/v1/wishlist`

---

## Endpoints

### 1. Add Product to Wishlist
Adds a product to the authenticated user's wishlist. Duplicate additions are rejected.

- **Method:** `POST`
- **Path:** `/api/v1/wishlist`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439033"
}
```

#### Responses:
- **201 Created**
```json
{
  "success": true,
  "message": "Product added to wishlist successfully",
  "data": {
    "_id": "67123abcd456ef7890123456",
    "user": "507f1f77bcf86cd799439011",
    "product": "507f1f77bcf86cd799439033",
    "createdAt": "2026-10-18T06:30:00.000Z",
    "updatedAt": "2026-10-18T06:30:00.000Z"
  }
}
```

- **400 Bad Request** (Invalid ID format, missing productId, or duplicate entry):
```json
{
  "success": false,
  "message": "Product is already in your wishlist"
}
```

- **401 Unauthorized** (Missing or invalid token):
```json
{
  "success": false,
  "message": "Not authorized, token missing"
}
```

- **404 Not Found** (Product does not exist):
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

### 2. Get User Wishlist
Retrieves a paginated list of wishlist items for the authenticated user.

- **Method:** `GET`
- **Path:** `/api/v1/wishlist?page=1&limit=10`
- **Headers:**
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 50)

#### Responses:
- **200 OK**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "totalItems": 1,
  "totalPages": 1,
  "data": [
    {
      "_id": "67123abcd456ef7890123456",
      "user": "507f1f77bcf86cd799439011",
      "product": {
        "_id": "507f1f77bcf86cd799439033",
        "name": "Wireless Noise-Canceling Headphones",
        "price": 299.99,
        "category": "Electronics",
        "image": "https://example.com/headphones.jpg",
        "stock": 15
      },
      "createdAt": "2026-10-18T06:30:00.000Z",
      "updatedAt": "2026-10-18T06:30:00.000Z"
    }
  ]
}
```

- **401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authorized, token missing"
}
```

---

### 3. Remove Product from Wishlist
Removes a product from the authenticated user's wishlist.

- **Method:** `DELETE`
- **Path:** `/api/v1/wishlist/:productId`
- **Headers:**
  - `Authorization: Bearer <jwt_token>`

#### Responses:
- **200 OK**
```json
{
  "success": true,
  "message": "Product removed from wishlist successfully"
}
```

- **400 Bad Request** (Invalid product ID format):
```json
{
  "success": false,
  "message": "Invalid product ID format"
}
```

- **404 Not Found** (Product not in user's wishlist):
```json
{
  "success": false,
  "message": "Wishlist item not found"
}
```
