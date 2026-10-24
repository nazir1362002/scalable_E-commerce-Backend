const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const Product = require("../src/models/Product");
const cloudinary = require("../src/config/cloudinary");

// Mock redis
jest.mock("../src/config/redis", () => {
    const store = new Map();
    return {
        redisClient: {
            isOpen: true,
            get: jest.fn(async (key) => store.get(key) || null),
            setEx: jest.fn(async (key, ttl, value) => {
                store.set(key, value);
            }),
            del: jest.fn(async (keys) => {
                const keyArray = Array.isArray(keys) ? keys : [keys];
                keyArray.forEach((k) => store.delete(k));
            }),
            scanIterator: jest.fn(async function* (options) {
                for (const key of store.keys()) {
                    if (options && options.MATCH) {
                        const pattern = options.MATCH.replace("*", ".*");
                        if (new RegExp(`^${pattern}$`).test(key)) {
                            yield key;
                        }
                    } else {
                        yield key;
                    }
                }
            })
        },
        connectRedis: jest.fn()
    };
});

jest.mock("../src/models/Product");

// Mock Cloudinary SDK
jest.mock("../src/config/cloudinary", () => {
    return {
        uploader: {
            upload_stream: jest.fn((options, callback) => {
                const stream = {
                    end: jest.fn((buffer) => {
                        if (buffer && buffer.toString().includes("TRIGGER_CLOUDINARY_ERROR")) {
                            callback(new Error("Mocked Cloudinary upload error"), null);
                        } else {
                            callback(null, {
                                secure_url: "https://res.cloudinary.com/demo/image/upload/v12345/products/sample.jpg",
                                public_id: "products/sample_id_123"
                            });
                        }
                    })
                };
                return stream;
            }),
            destroy: jest.fn(async (publicId) => {
                return { result: "ok" };
            })
        }
    };
});

describe("Products API & Cloudinary Image Upload Tests", () => {
    let adminToken;
    let userToken;

    beforeAll(() => {
        process.env.JWT_SECRET = "testsecretkey123";
        process.env.CLOUDINARY_CLOUD_NAME = "demo_cloud";
        process.env.CLOUDINARY_API_KEY = "123456789";
        process.env.CLOUDINARY_API_SECRET = "abcdef123456";

        adminToken = jwt.sign({ id: "admin123", role: "admin" }, process.env.JWT_SECRET);
        userToken = jwt.sign({ id: "user123", role: "user" }, process.env.JWT_SECRET);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/v1/products", () => {
        it("should return list of products and cache the response", async () => {
            const mockProducts = [
                { _id: "507f1f77bcf86cd799439011", name: "Laptop", price: 1000, category: "Tech" }
            ];

            Product.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockProducts)
            });
            Product.countDocuments.mockResolvedValue(1);

            const res = await request(app).get("/api/v1/products");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
        });

        it("should return 400 when minPrice is negative", async () => {
            const res = await request(app).get("/api/v1/products?minPrice=-10");

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/minPrice must be a valid positive number/i);
        });
    });

    describe("POST /api/v1/products (Image Upload)", () => {
        it("should reject unauthenticated upload (401)", async () => {
            const res = await request(app)
                .post("/api/v1/products")
                .attach("image", Buffer.from("fake image"), "test.jpg");

            expect(res.status).toBe(401);
        });

        it("should reject non-admin upload (403)", async () => {
            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("image", Buffer.from("fake image"), "test.jpg");

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Access denied");
        });

        it("should reject invalid file types (e.g. .pdf or .txt) (400)", async () => {
            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .attach("image", Buffer.from("some text"), {
                    filename: "document.pdf",
                    contentType: "application/pdf"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Only JPEG, PNG, and WebP images are allowed/i);
        });

        it("should allow admin to create a product WITHOUT an image", async () => {
            const newProduct = {
                _id: "507f1f77bcf86cd799439012",
                name: "Tablet No Img",
                price: 300,
                category: "Tech",
                description: "Nice tab"
            };

            Product.create.mockResolvedValue(newProduct);

            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newProduct);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it("should allow admin to upload a valid product image and parse string price/stock form-data fields (201)", async () => {
            const createdProductMock = {
                _id: "507f1f77bcf86cd799439015",
                name: "Camera",
                price: 500,
                category: "Electronics",
                description: "DSLR Camera",
                stock: 10,
                image: {
                    url: "https://res.cloudinary.com/demo/image/upload/v12345/products/sample.jpg",
                    publicId: "products/sample_id_123"
                }
            };

            Product.create.mockImplementation(async (data) => {
                expect(typeof data.price).toBe("number");
                expect(typeof data.stock).toBe("number");
                expect(data.price).toBe(500);
                expect(data.stock).toBe(10);
                return createdProductMock;
            });

            const imageBuffer = Buffer.from("fake jpeg image binary data");

            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Camera")
                .field("price", "500")
                .field("category", "Electronics")
                .field("description", "DSLR Camera")
                .field("stock", "10")
                .attach("image", imageBuffer, {
                    filename: "camera.jpg",
                    contentType: "image/jpeg"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.image.url).toContain("cloudinary.com");
            expect(res.body.data.image.publicId).toBe("products/sample_id_123");
        });

        it("should handle Cloudinary upload failure cleanly and not save product record", async () => {
            const errorBuffer = Buffer.from("TRIGGER_CLOUDINARY_ERROR");

            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Error Product")
                .field("price", "100")
                .field("category", "Test")
                .field("description", "Error desc")
                .attach("image", errorBuffer, {
                    filename: "error.jpg",
                    contentType: "image/jpeg"
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Cloudinary upload failed/i);
            expect(Product.create).not.toHaveBeenCalled();
        });
    });

    describe("PATCH /api/v1/products/:id (Image Replacement)", () => {
        it("should upload new image and delete old Cloudinary image after DB update succeeds", async () => {
            const oldProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Old Laptop",
                image: {
                    url: "https://res.cloudinary.com/demo/image/upload/old.jpg",
                    publicId: "products/old_id_123"
                }
            };

            const updatedProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Updated Laptop",
                price: 1200,
                image: {
                    url: "https://res.cloudinary.com/demo/image/upload/v12345/products/sample.jpg",
                    publicId: "products/sample_id_123"
                }
            };

            Product.findById.mockResolvedValue(oldProduct);
            Product.findByIdAndUpdate.mockResolvedValue(updatedProduct);

            const res = await request(app)
                .patch("/api/v1/products/507f1f77bcf86cd799439011")
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Updated Laptop")
                .field("price", "1200")
                .attach("image", Buffer.from("new image binary"), {
                    filename: "new_laptop.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("products/old_id_123");
        });

        it("should rollback newly uploaded Cloudinary image if DB update fails", async () => {
            const oldProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Old Laptop",
                image: {
                    url: "https://res.cloudinary.com/demo/image/upload/old.jpg",
                    publicId: "products/old_id_123"
                }
            };

            Product.findById.mockResolvedValue(oldProduct);
            Product.findByIdAndUpdate.mockRejectedValue(new Error("Database connection lost"));

            const res = await request(app)
                .patch("/api/v1/products/507f1f77bcf86cd799439011")
                .set("Authorization", `Bearer ${adminToken}`)
                .field("name", "Failing Update")
                .attach("image", Buffer.from("new image binary"), {
                    filename: "new.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            // Verify new image cleanup
            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("products/sample_id_123");
        });
    });

    describe("DELETE /api/v1/products/:id (Image Cleanup)", () => {
        it("should delete product and delete associated Cloudinary image", async () => {
            const deletedProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Laptop",
                image: {
                    url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                    publicId: "products/sample_id_123"
                }
            };

            Product.findByIdAndDelete.mockResolvedValue(deletedProduct);

            const res = await request(app)
                .delete("/api/v1/products/507f1f77bcf86cd799439011")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("products/sample_id_123");
        });
    });
});
