
import { Request, Response} from "../app";
import {ValidationChain, check}  from 'express-validator'
import prisma from "../prisma";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Controller from "./Controller";
import { VerificationCode } from "@prisma/client";
import { login, loginUserById } from "../helpers/Auth";
import Log from "../logger";

class LoginController  extends Controller {

    /**
     *  valiodation rules to validate login request
     * @returns array
     */
    public loginRules() : Array<ValidationChain> {
        return  [
            check('email', "email field is required").exists().isEmail().withMessage('value must be a valid email address'),
            check('password', "password field is required").exists()
        ]
    }

    /**
     * Login a new user into the application
     * @param req Request
     * @param res Response
     */
    public login =  async ( req : Request, res: Response ) =>  {

        const valid = await this.validate( this.loginRules(), req, res )
       
        if( valid  ) { 

            const user = await prisma.user.findFirst({
                where : {
                    email:req.body.email
                },
                select : {
                    id: true,
                    first_name:true,
                    password:true,
                    email:true,
                    phone:true,

                }
            });

            if( !user )  res.status(400).json({success : false, message:"user with given credential not found ", data: null});

            else  {

                const correctPasswprd = await bcrypt.compare( req.body.password, user.password ?? '' ) 

                if ( !correctPasswprd ) res.status(400).json({success : false, message:"please check your password and try again", data: null});

                else {

                    const token = await login(user, req.body.device_id);
                    if ( !token ) res.status(500).json({success : true, message: 'Something went wrong while generating token', data : null});
                    else res.json({success : true, message: 'User Logged In Successfully', data : token});
                }
            }
        }
    }

    /**
     *  valiodation rules to validate login request
     * @returns array
     */
    public socialLogInRules() : Array<ValidationChain> {
        return  [
            check('email', "email field is required").exists().isEmail().withMessage('value must be a valid email address'),
            check('first_name', "first_name field is required").exists(),
            check('provider_id', "provider_id field is required").exists()
        ]
    }

    /**
     * Api to allow user to log in to system 
     * using social login option
     * @param req 
     * @param res 
     */
    public socialLogin =  async ( req : Request, res: Response ) =>  {
        
        const valid = await this.validate( this.socialLogInRules(), req, res )
       
        if( valid  ) {

            try {

                let user = await prisma.user.findFirst({
                    where : {
                        provider_id : req.body.provider_id
                    }
                });
               
                const response = await prisma.$transaction( async (tx) => {

                    if( !user ) { 

                        delete req.body.device_id;

                        user =  await tx.user.create( {
                            data: {...req.body, provider: req.params.provider}
                        });
                    } 

                    const jwtOptions = {
                        expiresIn: '24h',  // Expire token in 24 hours
                    };

                    const { AUTH_TOKEN_KEY } = process.env;

                    const authToken = jwt.sign(user, AUTH_TOKEN_KEY!, jwtOptions);

                    await tx.personalAccessToken.create({
                        data: { user_id:user.id, token:authToken, device_id: req.body.device_id ?? null }
                    });

                    const { first_name, last_name, email, phone, id } = user;

                    return { id,first_name, last_name, email,phone, _token: authToken };
                
                }); 

                res.json({success : true, message: 'User Logged In Successfully', data : response});
            } catch ( error) {
                console.log(error)
                res.status(500).json({success : true, message: 'Something went wrong please try again', data : error});
            }
        }
    }

    /**
     * Api to allow user request otp for register/login
     * using OTP Login Options
     * @param req 
     * @param res 
     */
    public requestOtp =  async ( req : Request, res: Response ) =>  {
        
        const valid = await this.validate( [check('phone','phone no field is required').exists()], req, res )

        if( valid )
        {
            try {

                let user = await prisma.user.findUnique({
                    where : {
                        phone : req.body.phone
                    }
                });
               
                if( !user ) {
                    user = await prisma.user.create({
                        data : {
                            phone : req.body.phone,
                            profile:{
                                create: {
                                    
                                }
                            }
                        }
                    });
                }
                if(user) {
                    const verificationCode =  await this.generateOTP(user);

                    this.sendOtp( verificationCode ) ; //send OTP to user using third part service

                    res.json({success : true, message: 'An Otp has Beed Sent To Your Registered Mobile Number', data : user});
                }
            } catch ( error) {
                Log.info(error)
                res.status(500).json({success : true, message: 'Something went wrong please try again', data : error});
            }
        }
    }

    /**
     * Look for existing otp or generate
     * new if expired
     * @param user 
     * @returns VerificationCode
     */
    public generateOTP =  async ( user: any ) =>  {

        let date = new Date();
       
        let verificationCode = await prisma.verificationCode.findFirst({
            where : { 
                user_id : user.id,
                expired_at: {
                    gte: date 
                }
            },
            orderBy: { id:'desc' }
        });

        if( verificationCode )
        {
            return verificationCode;
        }
        else
        {
            date.setMinutes( date.getMinutes() + 2 );
            
            verificationCode = await prisma.verificationCode.create({
                data : {
                    user_id : user.id,
                    otp: '123456',
                    // otp: this.otp(),
                    expired_at: date
                }
            });

            return verificationCode

        } 
    }
    

    /**
     * Generate random otp 
     * @returns int
     */
    public otp = () => {
        var digits = '0123456789'; 
        let OTP = ''; 
        for (let i = 0; i < 5; i++ ) { 
            OTP += digits[Math.floor(Math.random() * 10)]; 
        } 
        return OTP; 
    }

    /**
     * Send OTP to user requested mobile number
     * @return void
     */
    public sendOtp = ( verificationCode : VerificationCode )=> {
        return;
    };


    /**
     * Api to allow user to log in to system 
     * using OTP Login Options
     * @param req 
     * @param res 
     */
    public otpLogin =  async ( req : Request, res: Response ) =>  {
        const valid = await this.validate(
            [
                check('otp','otp no field is required').exists(),
                check('user_id','user_id field is required').exists()
            ],
            req, res 
        )

        if( valid )
        {
            try {

                const date = new Date() ;
                let verificationCode = await prisma.verificationCode.findFirst({
                    where : {
                        user_id : req.body.user_id,
                        otp: req.body.otp,
                        expired_at: {
                            gte: date 
                        }
                    }
                });
                if( !verificationCode )  res.status(400).json({success : false, message: 'Please enter a valid OTP', data : null});
                else {

                    const token = await loginUserById( verificationCode.user_id ,req.body.device_id )

                    if ( !token ) res.status(500).json({success : true, message: 'Something went wrong while generating token', data : null});
                    else {
                        await prisma.verificationCode.delete({
                            where : {
                                id: verificationCode.id
                            }
                        });
                        res.json({success : true, message: 'User logged in successfully', data : token});
                    }
                    
                }
            } catch ( error) {
                console.log(error)
                res.status(500).json({success : true, message: 'Something went wrong please try again', data : error});
            }
        }
    }
}


export const loginController = new LoginController();