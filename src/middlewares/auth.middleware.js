import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","");
        console.log("Token from cookies or header:", token);
    
        if(!token){
            throw new ApiError(401,"Unauthorised access");
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(402,error?.message|| "Invalid token");
        }
        
        req.user=user;
        next();
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})


export {verifyJwt};