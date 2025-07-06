import 'dotenv/config';
import mongoose from "mongoose";
import connectDB from "./db/db.js";
import app from './app.js';



//database connection
connectDB()
.then(() => {
    app.listen(process.env.PORT||8000,() => {
        console.log(`App is listening on port= ${process.env.PORT}`);
    })
}).catch((err)=> {
    console.log("mongodb failed to connect",err);
});