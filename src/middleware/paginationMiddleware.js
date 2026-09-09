const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    // Validate page
    if (page !== undefined) {
        const pageNumber = Number(page);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer"
            });
        }
    }

    // Validate limit
    if (limit !== undefined) {
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Limit must be an integer between 1 and 50"
            });
        }
    }

    next();
};

module.exports = validatePagination;