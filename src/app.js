import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


//middlewares
app.use("cors"({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"}));     //to read data encoded in url
app.use(express.static("public"));
app.use(cookieParser());

//exporting app
export default app;