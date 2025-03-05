import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const MONGO_URI = process.env.MongoDB_URI;

if (!MONGO_URI) {
  console.error("MongoDB connection URI is missing!");
  process.exit(1);
}
const connection =async()=>{
    try{
        const con= await mongoose.connect(MONGO_URI);
        console.log(`Database connected to ${con.connection.host}`);
    }catch(err){
        console.log(err);
        process.exit(1);
    }

}
export default connection;
