import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectionIns= await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("MongoDB is connected");
        console.log(`\n connection is established at host ${connectionIns.connection.host}`);
        
        
    } catch (error) {
        console.log("Error connecting database", error);
        process.exit(1);
    }
}

export default connectDB;