const express = require("express");
const router = express.Router();
const products = require("../data/products");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");
const validateProduct = require("../middleware/validateProduct");
const { NotFoundError } = require("../utils/errors");

// Fetch all products
router.get("/", async (req, res) => {
    let result = products;

    // Filtering by category
    if (req.query.category) {
        result = result.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase())
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = result.slice(start, end);

    res.json({ total: result.length, page, limit, data: paginated });
});

// GET a specific product
router.get("/:id", async (req, res, next) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return next(new NotFoundError("Product not found"));
    res.json(product);
});

// Create new product POST
router.post("/", auth, validateProduct, async (req, res) => {
    const newProduct = { id: uuidv4(), ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Update product PUT
router.put("/:id", auth, validateProduct, async (req, res, next) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return next(new NotFoundError("Product not found"));
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
});

// DELETE product
router.delete("/:id", auth, async (req, res, next) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return next(new NotFoundError("Product not found"));
    const deleted = products.splice(index, 1);
    res.json({ message: "Product Deleted", deleted });
});

// Search by name
router.get("/search/:name", async (req, res) => {
    const term = req.params.name.toLowerCase();
    const found = products.filter(p => p.name.toLowerCase().includes(term));
    res.json(found);
});

// Product stats - by category
router.get("/stats/all", async (req, res) => {
    const stats = products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
    }, {});
    res.json(stats);
});

module.exports = router;