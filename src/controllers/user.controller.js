import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { User } from "../models/user.model.js";


const registerUser= asyncHandler( async(req,res) => {
    
    //logic building
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName,email,username,password} = req.body;
    console.log("req.body:",req.body);
    //validating if any field is empty
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    )
    {
        throw new ApiError(400,"All credentials are necessary");
    }

    const existedUser= await User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"User already registered with same email or Username");
    }

    //getting local path for avatar and coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.len>0)
    {
        coverImageLocalPath = req.files.coverImage[0],path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar not uploaded ,it is required");
    }

    console.log("avatar local path",avatarLocalPath);
    

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
       throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is registered Successfully")
    )

})

export {
    registerUser,
}