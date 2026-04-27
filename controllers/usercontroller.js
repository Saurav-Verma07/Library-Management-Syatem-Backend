import {User} from "../model/Usermodel.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import bcrypt from "bcrypt";
import {v2 as cloudinary} from "cloudinary";
export const getAllUsers =catchAsyncErrors(async(req,res)=>{
    const users=await User.find({accountVerified:true});
    res.status(200).json({
        success:true,
        users
    })
})

export const registerNewAdmin=catchAsyncErrors(async(req,res,next)=>{
    if(!req.files|| Object.keys(req.files).length===0){
        return next(new ErrorHandler("Please upload an avatar",400));
    }

    const {name,email,password}=req.body;
    if(!name||!email||!password){
        return next(new ErrorHandler("Please fill all required fields",400));
    }


const isregistered=await User.findOne({email, accountVerified:true});

if(isregistered){
    return next(new ErrorHandler("User already registered",400));
}

if(password.length<6){
    return next(new ErrorHandler("Password must be at least 6 to 12 characters long",400)
);
}

const {avatar}=req.files;
const allowedFormats=["image/jpeg","image/png","image/jpg"];
if(!allowedFormats.includes(avatar.mimetype)){
    return next(new ErrorHandler("Please upload avatar in jpeg,png or jpg format",400));
}
const hashedPassword=await bcrypt.hash(password,10);
const cloudinaryResponse=await cloudinary.uploader.upload(
    avatar.tempFilePath,{
    folder:"LIBRARY_MANAGEMENT_SYSTEM_ADMIN_AVATARS",
}
);

if(!cloudinaryResponse||cloudinaryResponse.error){
    console.error("Cloudinary upload error:", cloudinaryResponse.error||"Unknown Cloudinary error"
    );
    return next(new ErrorHandler("Failed to upload avatar. Please try again.",500));
}
const admin=await User.create({
    name,
    email,
    password:hashedPassword,
    role:"Admin",
    accountVerified:true,
    avatar:{
        public_id:cloudinaryResponse.public_id,
        url:cloudinaryResponse.secure_url,
    },
});
res.status(201).json({
    success:true,
    message:"Admin registered successfully",
    admin,
})
})