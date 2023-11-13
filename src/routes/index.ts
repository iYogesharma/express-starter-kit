import { Router } from "express";
import { registerController } from "../controllers/RegisterController";
import { loginController } from "../controllers/LoginController";
import { BearerToken } from "../middlewares/BearerToken";
import {userRouter} from './user';

export const router = Router();

 
router
    .post('/requestOtp', loginController.requestOtp)
    .post('/otp', loginController.otpLogin)
    .post('/register', registerController.register)
    .post('/login', loginController.login)
    .post('/:provider/login', loginController.socialLogin);


router.use('/api/v1/user', BearerToken, userRouter)
   