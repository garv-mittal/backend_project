import { ApiError } from "./apiError";
import { v2 as cloudinary } from "cloudinary";
import { log } from "console";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteFromCloudinary = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error(" Error deleting from Cloudinary:", error);
        throw new ApiError(501,"couldn't delete the old file");
    }
}

export {deleteFromCloudinary};