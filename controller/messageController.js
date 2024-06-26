import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js" 
import ErrorHandler from "../middlewares/error.js";
import { Message } from "../models/messageScheme.js";
import mongoose from "mongoose";

export const sendMessage=catchAsyncErrors(async(req,res,next)=>{
    const{ senderName,subject,message,phoneOrEmail}=req.body;
    if(!senderName || !subject || !message ){
        return next(new ErrorHandler("please Fill Full Form",400));
    }
    const data=await Message.create({senderName,subject,message,phoneOrEmail});
    res.status(200).json({
        success:true,
        message:"Message sent",
        data,
    });
});

export const getAllMessages = catchAsyncErrors(async(req,res,next)=>{
    const messages=await Message.find();
    res.status(200).json({
        success:true,
        messages,
    });
});
export const deleteMessage = catchAsyncErrors(async(req,res,next)=>{
    const { id }=req.params;
    const message=await Message.findById(id);
    if(!message){
        return next(new ErrorHandler("Message Already Deleted!",400));
    }
    await message.deleteOne();
    res.status(200).json({
        success:true,
        message:"Message Delated"
    });
});