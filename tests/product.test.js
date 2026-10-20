const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const Product = require("../src/models/Product");

// Mock dependencies
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

describe("Products API & Cache Integration Tests", () => {
    let adminToken;
    let userToken;

    beforeAll(() => {
        process.env.JWT_SECRET = "testsecretkey123";
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
            expect(res.body.data[0].name).toBe("Laptop");
        });

        it("should return 400 when minPrice is negative", async () => {
            const res = await request(app).get("/api/v1/products?minPrice=-10");

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/minPrice must be a valid positive number/i);
        });

        it("should return 400 when maxPrice is non-numeric", async () => {
            const res = await request(app).get("/api/v1/products?maxPrice=abc");

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/maxPrice must be a valid positive number/i);
        });
    });

    describe("GET /api/v1/products/:id", () => {
        it("should return 400 for invalid mongo ObjectId", async () => {
            const res = await request(app).get("/api/v1/products/invalid-id");

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid product ID");
        });

        it("should return 404 when product is not found", async () => {
            Product.findById.mockResolvedValue(null);

            const res = await request(app).get("/api/v1/products/507f1f77bcf86cd799439011");

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Product not found");
        });

        it("should return product details on success", async () => {
            const mockProduct = { _id: "507f1f77bcf86cd799439011", name: "Phone", price: 500 };
            Product.findById.mockResolvedValue(mockProduct);

            const res = await request(app).get("/api/v1/products/507f1f77bcf86cd799439011");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Phone");
        });
    });

    describe("POST /api/v1/products", () => {
        it("should deny access to unauthorized users (non-admin)", async () => {
            const res = await request(app)
                .post("/api/v1/products")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ name: "Tablet", price: 300, category: "Tech", description: "Nice tab" });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Access denied");
        });

        it("should allow admin to create a product and invalidate list cache", async () => {
            const newProduct = {
                _id: "507f1f77bcf86cd799439012",
                name: "Tablet",
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
            expect(res.body.data.name).toBe("Tablet");
        });
    });

    describe("PATCH /api/v1/products/:id", () => {
        it("should allow admin to update product and invalidate single and list cache", async () => {
            const updatedProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Updated Laptop",
                price: 1200
            };

            Product.findByIdAndUpdate.mockResolvedValue(updatedProduct);

            const res = await request(app)
                .patch("/api/v1/products/507f1f77bcf86cd799439011")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ name: "Updated Laptop", price: 1200 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Updated Laptop");
        });
    });

    describe("DELETE /api/v1/products/:id", () => {
        it("should allow admin to delete product and invalidate cache", async () => {
            const deletedProduct = {
                _id: "507f1f77bcf86cd799439011",
                name: "Laptop"
            };

            Product.findByIdAndDelete.mockResolvedValue(deletedProduct);

            const res = await request(app)
                .delete("/api/v1/products/507f1f77bcf86cd799439011")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product deleted successfully");
        });
    });
});
