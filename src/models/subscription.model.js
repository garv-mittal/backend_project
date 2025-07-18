import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.types.ObjectId,
        ref:"User",
    },
    channel:{
        type:mongoose.Schema.types.ObjectId,
        ref:"User",
    }
},{timestamps:true})


export const subscription = mongoose.model("Subscription",subscriptionSchema);