import { ValidationChain, check,body } from "express-validator";
import Controller from "./Controller";
import { Request, Response} from "../app";
import prisma from "../prisma";
import { imageValidator,removeFiles, removeFilesAtPath } from "../validators";
import Log from "../logger";

class PrfileController extends Controller {

    /**
     *  valiodation rules to validate login request
     * @returns array
     */
    public rules(req : Request) : Array<ValidationChain> {
        return [
            check('first_name', "last_name doesn't exists").optional().escape(),
            check('last_name', "last_name doesn't exists").optional().escape().trim(),
            check('email', 'Invalid email').optional().isEmail(),
            check('location').optional().escape().trim(),
            check('gender').optional().escape().trim(),
            check('age').optional().escape().trim(),
            check('image', 'Please upload valid images').custom( (value, { req: Request }) => imageValidator( req, req.files))
        ]
    }

    /**
     * store user profile information
     * @param req 
     * @param res 
     * @returns JsonResponse
     */
    public store = async ( req: Request, res: Response ) => {
    
        const valid = await this.validate( this.rules(req), req, res ) 
        
        if( valid ) {

            try {

                let data = req.body; data.user_id = req.user.id;

                if( data.email ){
                    const user = await prisma.user.findFirst({
                        where: {
                            email: data.email,
                            id:{
                                not: data.user_id
                            }
                        }
                    });

                    if( user )  return res.status(400).json({success:false, data:null, message: "another user with same email already exists" });
                }

                const date = new Date();

                if( Object.keys(data).length == 1 ){
                    return res.status(400).json({success:false, data:null, message: "nothing to update" });
                } else {
                    const response = await prisma.$transaction( async (tx) => {
                        const profile = await tx.profile.upsert({
                            where: {
                                user_id: data.user_id,
                            },
                            update: {
                                user_id:data.user_id,
                                image: data.image ?? null,
                                gender: data.gender ?? null,
                                updated_at: date
                            },
                            create: {
                                user_id:data.user_id,
                                image: data.image ?? null,
                                gender: data.gender ?? null,
                                updated_at: date
                            }
                        });

                        const user = await tx.user.update({
                            where: {
                                id: data.user_id
                            },
                            data: {
                                first_name: data.first_name,
                                last_name: data.last_name,
                                email: data.email,
                                updated_at: date
                            }
                        });

                        return { user, profile };
                    });

                   
                    if( response ) {
                        return res.json({success:true, data:response, message: "User profile has been updated successfully" });
                    } else {
                        removeFiles(req.files)
                        return res.status(500).json({success:true, data:null, message: "Something went wrong please try again" });
                    }
                }
            } catch (err) {
                removeFiles(req.files)
                Log.info(err)
                return res.status(500).json({success:true, data:err, message: "Something went wrong please try again" });
            }
           

           
        }
    }

     /**
     * update user profile information
     * @param req 
     * @param res 
     * @returns JsonResponse
     */
    public update = async ( req: Request, res: Response ) => {
        const valid = await this.validate( this.rules(req), req, res ) 
        
        if( valid ) {

            try {
               
                let data = req.body;

                data.user_id = req.user.id;

                if( data.email ){
                    const user = await prisma.user.findFirst({
                        where: {
                            email: data.email,
                            id:{
                                not: data.user_id
                            }
                        }
                    });
                 
                    if( user )  return res.status(400).json({success:false, data:null, message: "another user with same email already exists" });
                }


                const profile = await prisma.profile.findUnique({
                    where: {
                        user_id: data.user_id
                    }
                });

                if(!profile )  return res.status(400).json({success:false, data:null, message: "sorry profile info not found" });
  
                if( Object.keys(data).length == 1 ){
                    return res.status(400).json({success:false, data:null, message: "nothing to update" });
                } else {
                    const date = new Date();
                    const response = await prisma.$transaction( async (tx) => {
                        const updatedProfile = await tx.profile.update({
                            where: {
                                user_id: data.user_id
                            },
                            data: {
                                image: data.image ?? null,
                                bio: data.bio ?? null,
                                gender: data.gender ?? null,
                                updated_at: date
                            }
                        });
                       
                        const user = await tx.user.update({
                            where: {
                                id: data.user_id
                            },
                            data: {
                                first_name: data.first_name,
                                last_name: data.last_name,
                                email: data.email,
                                updated_at: date
                            }
                        });
                       
                        return { user, updatedProfile };
                    });

                   
                    if( response ) {
                        
                        if( profile ) {
                            removeFilesAtPath( [profile.image] )
                        }
                       
                        return res.json({success:true, data:response, message: "User profile has been updated successfully" });
                    } else {
                        removeFiles(req.files)
                        return res.status(500).json({success:false, data:null, message: "Something went wrong please try again" });
                    }
                }
            } catch (err) {
                removeFiles(req.files)
                Log.info(err)
                return res.status(500).json({success:true, data:err, message: "Something went wrong please try again" });
            }
        }
    }
}


export const profileController = new PrfileController;