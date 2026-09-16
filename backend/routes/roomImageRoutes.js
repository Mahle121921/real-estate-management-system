const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/authMiddleware");

const {
    getRoomImages,
    uploadRoomImage,
    deleteRoomImage
} = require("../controllers/roomImageController");


// ==========================================
// CREATE UPLOAD DIRECTORY
// ==========================================
const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "rooms"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}


// ==========================================
// MULTER STORAGE
// ==========================================
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const roomId = req.params.roomId;

        const uniqueName =
            `room-${roomId}-${Date.now()}${extension}`;

        cb(null, uniqueName);
    }
});


// ==========================================
// FILE FILTER
// ==========================================
const fileFilter = (req, file, cb) => {

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
                "Only JPG, JPEG, PNG, and WEBP images are allowed"
            )
        );
    }
};


// ==========================================
// MULTER
// ==========================================
const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// ==========================================
// GET ROOM IMAGES
// ==========================================
router.get(
    "/:roomId/images",

    authenticateToken,

    authorizeRole(
        "Owner",
        "Administrator",
        "Sales Agent",
        "Customer"
    ),

    getRoomImages
);


// ==========================================
// UPLOAD ROOM IMAGE
// ==========================================
router.post(
    "/:roomId/images",

    authenticateToken,

    authorizeRole(
        "Owner",
        "Administrator"
    ),

    upload.single("image"),

    uploadRoomImage
);


// ==========================================
// DELETE ROOM IMAGE
// ==========================================
router.delete(
    "/:roomId/images/:imageId",

    authenticateToken,

    authorizeRole(
        "Owner",
        "Administrator"
    ),

    deleteRoomImage
);


module.exports = router;