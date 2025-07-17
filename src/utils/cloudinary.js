import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error(" Cloudinary Upload Failed:", error.message);
        if (fs.existsSync(localFilePath)) 
        {
            console.log("Deleting local file:", localFilePath);
            fs.unlinkSync(localFilePath);
        }
    }
}


export { uploadOnCloudinary };