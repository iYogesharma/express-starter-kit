import { Router } from "express";
import { profileController } from "../controllers/ProfileController";
import { upload } from "../helpers/upload";

export const userRouter = Router();

userRouter
    .post('/:id/profile', upload.any(), profileController.store) 
    .put('/:id/profile', upload.any(),profileController.update);