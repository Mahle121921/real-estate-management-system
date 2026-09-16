const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// HELPER: GET USER ROLE
// ==========================================
const getUserRole = (req) => {
    return String(
        req.user?.role ||
        req.user?.Role ||
        req.user?.RoleName ||
        req.user?.roleName ||
        ""
    )
        .trim()
        .toLowerCase();
};


// ==========================================
// HELPER: GET OWNER ID
// ==========================================
const getOwnerId = async (req) => {
    const userId =
        req.user?.UserID ??
        req.user?.userID ??
        req.user?.userId ??
        req.user?.id;

    if (!userId) {
        return null;
    }

    const [owners] = await pool.query(
        `
        SELECT OwnerID
        FROM owners
        WHERE UserID = ?
        LIMIT 1
        `,
        [userId]
    );

    return owners.length > 0
        ? owners[0].OwnerID
        : null;
};


// ==========================================
// CHECK ROOM ACCESS
// ==========================================
const getRoomForUser = async (req, roomId) => {
    let query = `
        SELECT
            r.RoomID,
            r.RoomNumber,
            r.RoomType,
            r.FloorID,
            f.FloorNumber,
            b.BuildingID,
            b.BuildingName,
            p.PropertyID,
            p.PropertyName,
            p.OwnerID
        FROM rooms r
        INNER JOIN floors f
            ON r.FloorID = f.FloorID
        INNER JOIN buildings b
            ON f.BuildingID = b.BuildingID
        INNER JOIN properties p
            ON b.PropertyID = p.PropertyID
        WHERE r.RoomID = ?
    `;

    const params = [roomId];

    if (getUserRole(req) === "owner") {
        const ownerId = await getOwnerId(req);

        if (!ownerId) {
            return null;
        }

        query += `
            AND p.OwnerID = ?
        `;

        params.push(ownerId);
    }

    const [rooms] = await pool.query(query, params);

    return rooms.length > 0 ? rooms[0] : null;
};


// ==========================================
// GET ROOM IMAGES
// ==========================================
const getRoomImages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await getRoomForUser(req, roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission to access it"
            });
        }

        const [images] = await pool.query(
            `
            SELECT
                RoomImageID,
                RoomID,
                ImagePath,
                Caption,
                UploadDate
            FROM room_images
            WHERE RoomID = ?
            ORDER BY UploadDate DESC, RoomImageID DESC
            `,
            [roomId]
        );

        return res.status(200).json({
            success: true,
            room,
            count: images.length,
            images
        });

    } catch (error) {
        console.error("Get room images error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve room images",
            error: error.message
        });
    }
};


// ==========================================
// UPLOAD ROOM IMAGE
// ==========================================
const uploadRoomImage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { caption } = req.body || {};

        // ==========================================
        // CHECK ROOM
        // ==========================================
        const room = await getRoomForUser(req, roomId);

        if (!room) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission to modify it"
            });
        }

        // ==========================================
        // CHECK FILE
        // ==========================================
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image"
            });
        }

        // ==========================================
        // SAVE RELATIVE PATH
        // ==========================================
        const imagePath =
            `rooms/${req.file.filename}`;

        // ==========================================
        // SAVE DATABASE RECORD
        // ==========================================
        const [result] = await pool.query(
            `
            INSERT INTO room_images
            (
                RoomID,
                ImagePath,
                Caption
            )
            VALUES (?, ?, ?)
            `,
            [
                roomId,
                imagePath,
                caption && String(caption).trim()
                    ? String(caption).trim()
                    : null
            ]
        );

        // ==========================================
        // GET CREATED IMAGE
        // ==========================================
        const [images] = await pool.query(
            `
            SELECT
                RoomImageID,
                RoomID,
                ImagePath,
                Caption,
                UploadDate
            FROM room_images
            WHERE RoomImageID = ?
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Room image uploaded successfully",
            image: images[0]
        });

    } catch (error) {
        console.error("Upload room image error:", error);

        // Delete uploaded file if database insertion fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Failed to upload room image",
            error: error.message
        });
    }
};


// ==========================================
// DELETE ROOM IMAGE
// ==========================================
const deleteRoomImage = async (req, res) => {
    try {
        const { roomId, imageId } = req.params;

        // ==========================================
        // CHECK ROOM ACCESS
        // ==========================================
        const room = await getRoomForUser(req, roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message:
                    "Room not found or you do not have permission"
            });
        }

        // ==========================================
        // FIND IMAGE
        // ==========================================
        const [images] = await pool.query(
            `
            SELECT
                RoomImageID,
                RoomID,
                ImagePath
            FROM room_images
            WHERE RoomImageID = ?
              AND RoomID = ?
            LIMIT 1
            `,
            [imageId, roomId]
        );

        if (images.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room image not found"
            });
        }

        const image = images[0];

        // ==========================================
        // DELETE DATABASE RECORD
        // ==========================================
        await pool.query(
            `
            DELETE FROM room_images
            WHERE RoomImageID = ?
              AND RoomID = ?
            `,
            [imageId, roomId]
        );

        // ==========================================
        // DELETE PHYSICAL FILE
        // ==========================================
        const filePath = path.join(
            __dirname,
            "..",
            "uploads",
            image.ImagePath
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return res.status(200).json({
            success: true,
            message: "Room image deleted successfully"
        });

    } catch (error) {
        console.error("Delete room image error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete room image",
            error: error.message
        });
    }
};


module.exports = {
    getRoomImages,
    uploadRoomImage,
    deleteRoomImage
};