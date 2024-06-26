import express from "express"
import {register,login,logout, getUser, updateProfile, updatePassword, getUserForProtfolio, forgotPassword,  resetPassword} from "../controller/userController.js"
import { isAuthenticated } from "../middlewares/auth.js";

const router=express.Router();

router.post("/register",register);
router.post("/login",login);
router.get("/logout",isAuthenticated,logout);
router.get("/me",isAuthenticated,getUser);
router.put("/update/me",isAuthenticated,updateProfile);
router.put("/update/password",isAuthenticated,updatePassword);
router.get("/me/portfolio",getUserForProtfolio);
router.post("/password/forgot",forgotPassword);
router.put("/password/reset/:token",resetPassword);

export default router;