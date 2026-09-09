import mongoose from "mongoose";
import {} from 'dotenv/config';

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.mongo_url  || '');
        console.log(`connected MOngoDb`);
    }catch(err){
        console.error('Database connection error:', err);
        // console.log(`Database connection error: ${process.env.mongo_url}`);
    }
}

export default connectDB;

