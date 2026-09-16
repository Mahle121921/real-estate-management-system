const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const {
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    searchProperties
} = require("../controllers/propertyController");

const uploadDir = path.join(
    __dirname,
    "../uploads/properties"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension =
            path.extname(file.originalname);

        const fileName =
            `property-${Date.now()}${extension}`;

        cb(null, fileName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    }
});

// ==========================================
// VIEW ALL PROPERTIES
// ==========================================
router.get(
    "/",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Manager",
        "Sales Agent",
        "Customer"
    ),
    getProperties
);

// ==========================================
// SEARCH PROPERTIES
// IMPORTANT: Keep this BEFORE /:id
// ==========================================
router.get(
    "/search",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent", "Customer"),
    searchProperties
);

// ==========================================
// VIEW ONE PROPERTY
// ==========================================
router.get(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent", "Customer"),
    getPropertyById
);

// ==========================================
// CREATE PROPERTY
// ==========================================
router.post(
    "/",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    createProperty
);

// ==========================================
// GET ALL IMAGES FOR ONE PROPERTY
// IMPORTANT: Keep this BEFORE /:id
// ==========================================
router.get(
    "/:id/images",
    authenticateToken,
    authorizeRole(
        "Owner",
        "Administrator",
        "Manager",
        "Sales Agent",
        "Customer"
    ),
    async (req, res) => {
        try {
            const propertyId = req.params.id;

            const [images] = await pool.query(
                `
                SELECT
                    PropertyImageID,
                    PropertyID,
                    ImagePath,
                    Caption
                FROM property_images
                WHERE PropertyID = ?
                ORDER BY PropertyImageID ASC
                `,
                [propertyId]
            );

            const formattedImages = images.map((image) => ({
                PropertyImageID: image.PropertyImageID,
                PropertyID: image.PropertyID,
                ImagePath: image.ImagePath,
                Caption: image.Caption,
                ImageURL:
                    `http://localhost:5000/${image.ImagePath}`
            }));

            return res.json({
                success: true,
                images: formattedImages
            });

        } catch (error) {
            console.error(
                "Get property images error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to load property images."
            });
        }
    }
);

// ==========================================
// UPDATE PROPERTY
// ==========================================
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    updateProperty
);
router.post(
    "/:id/images",
    authenticateToken,
    authorizeRole("Owner", "Administrator"),
    upload.single("image"),
    async (req, res) => {
        try {
            const propertyId = req.params.id;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please select an image."
                });
            }

            const imagePath =
                `uploads/properties/${req.file.filename}`;

            const [result] = await pool.query(
                `
                INSERT INTO property_images
                (
                    PropertyID,
                    ImagePath,
                    Caption
                )
                VALUES (?, ?, ?)
                `,
                [
                    propertyId,
                    imagePath,
                    req.body.caption || null
                ]
            );

            return res.status(201).json({
                success: true,
                message: "Property image uploaded successfully.",
                image: {
                    PropertyImageID: result.insertId,
                    PropertyID: propertyId,
                    ImagePath: imagePath,
                    Caption: req.body.caption || null,
                    ImageURL:
                        `http://localhost:5000/${imagePath}`
                }
            });

        } catch (error) {
            console.error(
                "Property image upload error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to upload property image."
            });
        }
    }
);

// ==========================================
// UPDATE PROPERTY STATUS
// ==========================================
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole("Owner", "Administrator", "Sales Agent"),
    updatePropertyStatus
);

 

module.exports = router;