import mongoose from "mongoose";




export const connectDB =() =>{
    mongoose.connect(process.env.MONGO_URL,{
        dbName: "Library"

    })
    .then(() => {
        console.log("Connected to Database");
    }).catch(err=> {
        console.log("Error while connecting to database",err);
    });
};

