import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = mongoose.Schema(
    {
        username : {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            index:true,
            trim:true
        },
        fullName : {
            type:String,
            required:true,
            index:true,
            trim:true
        },
        email : {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        avatar : {
            type:String,
            required:true,
        },
        coverImage : {
            type:String,                //cloudinary url
        },
        watchHistory:[
            {
                type : mongoose.Schema.Types.ObjectId,
                ref:"Video",
            }
        ],
        password:{
            type:String,
            required:[true,"password is required!"],
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();          //checking if password is updated or not
    
    this.password= await bcrypt.hash(this.password,10);          //hashing the password for secure storage
    next();    
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password);            //check if pass enter by user is same as stored in DB    
}

userSchema.methods.generateAccessToken= function () {
    return jwt.sign(                                    //method to gen access token for user
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(                                    //method to gen refresh token
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)