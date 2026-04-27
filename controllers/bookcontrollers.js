import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import {Book}from "../model/bookmodel.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";


export const addBook=catchAsyncErrors(async(req,res,next)=>{
    const {title,author,discription,price,quantity}=req.body||{}
    if(!title||!author||!discription||!price||!quantity){
        return next(new ErrorHandler("Please fill all fields",400))
    }
    const book= await Book.create({title,author,discription,price,quantity})
res.status(201).json({
success:true,
message:"Book added Successfully",
book
})


})
export const getallBooks=catchAsyncErrors(async(req,res,)=>{
const books=await Book.find()
res.status(200).json({
    success:true,
    books,
})
})

export const deleteBook=catchAsyncErrors(async(req,res,next)=>{
const {id}=req.params;
const book=await Book.findById(id)
if(!book){
    return next(new ErrorHandler("Book not found",404))
}
await book.deleteOne()
res.status(200).json({
success:true,
message:"Book deleted Successfully"
})


})
