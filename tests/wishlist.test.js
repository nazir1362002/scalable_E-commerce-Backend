const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const Wishlist = require("../src/models/Wishlist");
const Product = require("../src/models/Product");

// Mock redis
jest.mock("../src/config/redis", () => {
    return {
        redisClient: {
            isOpen: true,
            get: jest.fn().mockResolvedValue(null),
            setEx: jest.fn().mockResolvedValue(true),
            del: jest.fn().mockResolvedValue(1),
            scanIterator: jest.fn(async function* () {})
        },
        connectRedis: jest.fn()
    };
});

jest.mock("../src/models/Wishlist");
jest.mock("../src/models/Product");

describe("Wishlist API Integration Tests", () => {
    let userToken;
    let user2Token;
    const userId1 = "507f1f77bcf86cd799439011";
    const userId2 = "507f1f77bcf86cd799439022";
    const productId1 = "507f1f77bcf86cd799439033";

    beforeAll(() => {
        process.env.JWT_SECRET = "testsecretkey123";
        userToken = jwt.sign({ id: userId1, role: "user" }, process.env.JWT_SECRET);
        user2Token = jwt.sign({ id: userId2, role: "user" }, process.env.JWT_SECRET);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/v1/wishlist", () => {
        it("should return 401 when request is unauthenticated", async () => {
            const res = await request(app)
                .post("/api/v1/wishlist")
                .send({ productId: productId1 });

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/token missing/i);
        });

        it("should return 400 when productId is missing", async () => {
            const res = await request(app)
                .post("/api/v1/wishlist")
                .set("Authorization", `Bearer ${userToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("productId is required");
        });

        it("should return 400 when productId format is invalid", async () => {
            const res = await request(app)
                .post("/api/v1/wishlist")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ productId: "invalid-id" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Invalid product ID format");
        });

        it("should return 404 when product does not exist", async () => {
            Product.findById.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/v1/wishlist")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ productId: productId1 });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Product not found");
        });

        it("should return 400 when product is already in user wishlist", async () => {
            Product.findById.mockResolvedValue({ _id: productId1, name: "Laptop" });
            Wishlist.findOne.mockResolvedValue({ _id: "wishlist1", user: userId1, product: productId1 });

            const res = await request(app)
                .post("/api/v1/wishlist")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ productId: productId1 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Product is already in your wishlist");
        });

        it("should successfully add product to wishlist (201)", async () => {
            Product.findById.mockResolvedValue({ _id: productId1, name: "Laptop" });
            Wishlist.findOne.mockResolvedValue(null);
            Wishlist.create.mockResolvedValue({
                _id: "wishlist1",
                user: userId1,
                product: productId1
            });

            const res = await request(app)
                .post("/api/v1/wishlist")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ productId: productId1 });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product added to wishlist successfully");
            expect(res.body.data.product).toBe(productId1);
        });
    });

    describe("GET /api/v1/wishlist", () => {
        it("should return 401 when request is unauthenticated", async () => {
            const res = await request(app).get("/api/v1/wishlist");

            expect(res.status).toBe(401);
        });

        it("should return paginated wishlist items for authenticated user", async () => {
            const mockItems = [
                {
                    _id: "wishlist1",
                    user: userId1,
                    product: { _id: productId1, name: "Laptop", price: 1000 }
                }
            ];

            Wishlist.countDocuments.mockResolvedValue(1);
            Wishlist.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockItems)
            });

            const res = await request(app)
                .get("/api/v1/wishlist?page=1&limit=10")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.totalItems).toBe(1);
            expect(res.body.data).toHaveLength(1);
            expect(Wishlist.countDocuments).toHaveBeenCalledWith({ user: userId1 });
        });

        it("should enforce ownership isolation (User B receives empty list if no items created for User B)", async () => {
            Wishlist.countDocuments.mockResolvedValue(0);
            Wishlist.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            });

            const res = await request(app)
                .get("/api/v1/wishlist")
                .set("Authorization", `Bearer ${user2Token}`);

            expect(res.status).toBe(200);
            expect(res.body.totalItems).toBe(0);
            expect(res.body.data).toEqual([]);
            expect(Wishlist.countDocuments).toHaveBeenCalledWith({ user: userId2 });
        });
    });

    describe("DELETE /api/v1/wishlist/:productId", () => {
        it("should return 401 when request is unauthenticated", async () => {
            const res = await request(app).delete(`/api/v1/wishlist/${productId1}`);

            expect(res.status).toBe(401);
        });

        it("should return 400 for invalid productId format", async () => {
            const res = await request(app)
                .delete("/api/v1/wishlist/invalid-id")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Invalid product ID format");
        });

        it("should return 404 when wishlist entry is not found for the user", async () => {
            Wishlist.findOneAndDelete.mockResolvedValue(null);

            const res = await request(app)
                .delete(`/api/v1/wishlist/${productId1}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Wishlist item not found");
            expect(Wishlist.findOneAndDelete).toHaveBeenCalledWith({
                user: userId1,
                product: productId1
            });
        });

        it("should return 200 when wishlist item is successfully removed", async () => {
            Wishlist.findOneAndDelete.mockResolvedValue({
                _id: "wishlist1",
                user: userId1,
                product: productId1
            });

            const res = await request(app)
                .delete(`/api/v1/wishlist/${productId1}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Product removed from wishlist successfully");
        });
    });
});
