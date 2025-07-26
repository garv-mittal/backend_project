import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { generateAccessAndRefereshTokens } from "../utils/generateTokens.js";
import {jwt} from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { subscription } from "../models/subscription.model.js";


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
    console.log("username:",username);
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
        avatarPublicId:avatar?.public_id,
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

    return res
    .status(201)
    .json(
        new ApiResponse(200, createdUser, "User is registered Successfully")
    )

})


const loginUser = asyncHandler (async (req,res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, password} = req.body;

    if(!email){
        throw new ApiError(400,"Email is required to login");
    }

    const user = await User.findOne({ email });

    if(!user){
        throw new ApiError(404,"User not found, check email or try registering first");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"incorrect password");
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const {accessToken, refreshToken}=await generateAccessAndRefereshTokens(user._id);

    const options={
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken, refreshToken
            },
            "User successfully logged in"
        )
    )
})


const logoutUser = asyncHandler(async (req,res) => {
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true                   //used to return the new updated user
        }
    )

    const options = {                   //makes sure tht only backend can edit the tokens in cookies
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token not found, invalid request");
    }

    try {
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(402,"invalid refresh token");
        }

        //makes sure that fetched refresh token is latest and is same as stored in db
        if(incomingRefreshToken!==user.refreshToken){
            throw new ApiError(401,"refresh token expired or changed")
        }

        const options={
            httpOnly:true,
            secure:true
        }

        //new user tokens generated and sent to user and saved to db
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {

                throw new ApiError(401, error?.message || "Invalid refresh token")

    }
})


const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword,newPassword} = req.body;

    const user =await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(401,"old password do not match, try again")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changes successfully"))

})


const currentUser = asyncHandler(async (req, res) => {
    
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched"));

})


const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullName,username} = req.body;
    if (!fullName || !username) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                username:username
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})


const updateUserAvatar = asyncHandler(async(req, res) => {
    
    //to delete the old image
    const oldAvatarPublicId = user.avatarPublicId;
    
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url || !avatar.public_id) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url,
                avatarPublicId:avatar.public_id
            }
        },
        {new: true}
    ).select("-password")

    //deleting the old image by first making sure tht old image exists
    if(oldAvatarPublicId){
        await deleteFromCloudinary(oldAvatarPublicId);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})


const updateUserCoverImage = asyncHandler(async(req, res) => {

    //to be able to delete old image
    const oldCoverImagePublicId = user.coverImagePublicId;

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }

    const avatar = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on cover image")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url,
                coverImagePublicId:coverImage.public_id
            }
        },
        {new: true}
    ).select("-password")

    //deleting the old image by first making sure tht old image exists
    if(oldAvatarPublicId){
        await deleteFromCloudinary(oldAvatarPublicId);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async (req,res) => {
    const username=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username not found/missing");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscribe"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
    ])

    if(!channel){
        throw new ApiError(404,"channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(req.user_id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].WatchHistory,
            "watch history fetched for the user successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
}