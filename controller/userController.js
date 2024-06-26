import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User  } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendemails.js";
import crypto from "crypto";

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Avatar And Resume are Required", 400));
  }

  const { avatar, resume } = req.files;
  const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    { folder: "AVATARS" }
  );
  if (!cloudinaryResponseForAvatar || cloudinaryResponseForAvatar.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponseForAvatar.error || "unknown cloudinary error"
    );
    return next(new ErrorHandler("Avatar upload failed", 500));
  }


  const cloudinaryResponseForResume = await cloudinary.uploader.upload(
    resume.tempFilePath,
    { folder: "MY_RESUME" }
  );
  if (!cloudinaryResponseForResume || cloudinaryResponseForResume.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponseForResume.error || "unknown cloudinary error"
    );
    return next(new ErrorHandler("Resume upload failed", 500));
  }

  const {
    fullName,
    email,
    phone,
    aboutme,
    password,
    portfolioURL,
    githubURL,
    instagramURL,
    facebookURL,
    twitterURL,
    linkedInURL,
  } = req.body;

  const user = await User.create({
    fullName,
    email,
    phone,
    aboutme,
    password,
    portfolioURL,
    githubURL,
    instagramURL,
    facebookURL,
    twitterURL,
    linkedInURL,
    avatar: {
      public_id: cloudinaryResponseForAvatar.public_id,
      url: cloudinaryResponseForAvatar.secure_url,
    },
    resume: {
      public_id: cloudinaryResponseForResume.public_id,
      url: cloudinaryResponseForResume.secure_url,
    },
  });
    generateToken(user,"user registered",201,res);
});
export const login = catchAsyncErrors(async(req,res,next)=>{
  const {email,password} =req.body;
  if(!email ||!password){
    return next(new ErrorHandler("Email and Password are required"));
  }
  const user = await User.findOne({email}).select("+password");
  if(!user){
    return next(new ErrorHandler("Invalid Emaill or Password!!"))
  }
  const isPasswordMatched = await user.comparePassword(password);
  if(!isPasswordMatched){
    return next (new ErrorHandler("Invalid Passwordd!!"));
  }
  generateToken(user,"Logged In",200,res);
});

export const logout = catchAsyncErrors(async(req,res,next)=>{
  res
    .status(200)
    .cookie("token","",{
      expires:new Date(Date.now()),
      httpOnly:true,
      sameSite: "None",
      secure: true
    })
    .json({
      success:true,
      message:"Logged Out",
    });
});
export const getUser = catchAsyncErrors(async(req,res,next)=>{
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success:true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    aboutme,
    portfolioURL,
    githubURL,
    instagramURL,
    facebookURL,
    twitterURL,
    linkedInURL
  } = req.body;

  const newUserdata = {
    fullName,
    email,
    phone,
    aboutme,
    portfolioURL,
    githubURL,
    instagramURL,
    facebookURL,
    twitterURL,
    linkedInURL
  };

  if (req.files && req.files.avatar) {
    const avatar = req.files.avatar;
    const user = await User.findById(req.user.id);
    const profileImageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(profileImageId);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      { folder: "AVATARS" }
    );
    newUserdata.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const user = await User.findById(req.user.id);
    const resumeId = user.resume.public_id;
    await cloudinary.uploader.destroy(resumeId);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath,
      { folder: "MY_RESUME" }
    );
    newUserdata.resume = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserdata, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Profile Updated!!",
    user,
  });
});

export const updatePassword = catchAsyncErrors(async(req,res,next)=>{
  const{currentPassword,newPassword,confirmNewPassword}=req.body;
  if(!currentPassword || !newPassword || !confirmNewPassword){
    return next(new ErrorHandler("Please Fill All Fields",400));
  }
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if(!isPasswordMatched){
    return next(new ErrorHandler("Incorrect Current password",400));
  }
  if(newPassword !== confirmNewPassword){
    return next(new ErrorHandler("New password and confirmNewPassword do not match",400));
  }
  user.password=newPassword;
  await user.save();
  res.status(200).json({
    success:true,
    message:"Password Updated"
  });
});

export const getUserForProtfolio = catchAsyncErrors(async(req,res,next)=>{
  const id ="667afdeb472e6948d2f5be27";
  const user = await User.findById(id);
  res.status(200).json({
    success:true,
    user,
  });
});

export const forgotPassword = catchAsyncErrors(async(req,res,next)=>{
  const user = await User.findOne({email:req.body.email});
  if(!user){
    return next(new ErrorHandler("user not found!!",404))
  }
  const resetToken = user.resetPasswordToken();
  await user.save({validBeforeSave:false});
  const resetPasswordURL = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;
  const message = `Your Reset Password Token is :-\n\n ${resetPasswordURL}\n\n If you have not request for this kindly ignore`;

  try{
    await sendEmail({
      email:user.email,
      subject:"Personal Portfolio Dashboard Recovery Password",
      message,
    });
    res.status(200).json({
      success:true,
      message:`Email send to ${user.email} successfully`
    });
  }
  catch(error){
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;
    await user.save();
    return next(new ErrorHandler(error,500));
  }
});

export const resetPassword = catchAsyncErrors(async(req,res,next)=>{
  const {token}=req.params;
  const resetPasswordToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire:{$gt:Date.now()},
  });
  if(!user){
    return next(
      new ErrorHandler("Reset password token is invalid or has been expired",400)
    );
  }
  if(req.body.password !=req.body.confirmPassword){
    return next(new ErrorHandler("password and confirmPassword do no match"));
  }
  user.password=req.body.password;
  user.resetPasswordExpire=undefined;
  user.resetPasswordToken=undefined;
  await user.save();
  generateToken(user,"Reset password Successfully",200,res);
});