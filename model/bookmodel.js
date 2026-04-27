import mongoose from "mongoose";

const bookSchema=new mongoose.Schema({
    title:{
        type:String,
        require:true,
        trim:true
    },
    author:{
         type:String,
        require:true,
        trim:true

    },
    discription:{
         type:String,
        require:true,
        
    },
    price:{
         type:String,
        require:true
        
    },
    quantity:{
         type:Number,
        require:true
    },
    availability:{
         type:Boolean,
        default:true
    },
},
{
timestamps:true
}
)


export const Book=mongoose.model("Book",bookSchema)