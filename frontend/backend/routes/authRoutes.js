import express from 'express'
import auth from '../middleware/auth.js'
import { 
    getMe, 
    loginUser, 
    registerUser, 
    requestRegistrationOtp, 
    updateProfile, 
    verifyRegistrationOtp 
} from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/register/request-otp", requestRegistrationOtp);
authRouter.post("/register/verify-otp", verifyRegistrationOtp);
authRouter.post("/login", loginUser);
authRouter.post("/me", auth, getMe);
authRouter.post("/profile", auth, updateProfile);

export default authRouter;