import { User } from "../models/user.model.js"
import { ApiError } from "./apiError.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user=await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(501,"something went wrong,please try again");
    }
}

export {generateAccessAndRefereshTokens};