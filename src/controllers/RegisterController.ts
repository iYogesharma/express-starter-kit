
import { Request, Response} from "../app";
import {ValidationChain, check}  from 'express-validator'
import prisma from "../prisma";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Controller from "./Controller";

class RegisterController  extends Controller {

    /**
     *  valiodation rules to validate register request
     * @returns array
     */
    public registerRules() : Array<ValidationChain> {
        return  [
            check('first_name', "first_name field is required").exists().isAlphanumeric(),
            check('last_name', "last_name doesn't exists").optional().isAlphanumeric(),
            check('email', 'Invalid email').exists().isEmail(),
            check('phone', 'Invalid phone number').optional().escape().isLength({min: 10, max:13})
            .withMessage('phone number must be of min 10 and max 11 digits')
            .matches(/^((\+){0,1}91(\s){0,1}(\-){0,1}(\s){0,1}){0,1}9[0-9](\s){0,1}(\-){0,1}(\s){0,1}[1-9]{1}[0-9]{7}$/)       ,
            check('password','The password must be 8+ chars long and must contain 1 number, symbol, lowercase and uppercase letter').exists()
            .not().isIn(['123', 'password', 'god','secret','12345678'])
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
                returnScore: false,
                pointsPerUnique: 1,
                pointsPerRepeat: 0.5,
                pointsForContainingLower: 10,
                pointsForContainingUpper: 10,
                pointsForContainingNumber: 10,
                pointsForContainingSymbol: 10,
            })
        ]
    }

    /**
     * Register a new user in the application
     * @param req Request
     * @param res Response
     */
    public register = async ( req : Request, res: Response ) =>  {

        const valid = await this.validate( this.registerRules(), req, res )
       
        if( valid  ) {
           
            let user = await prisma.user.findFirst({
                where : {
                    email:req.body.email,
                    OR: [
                        { phone:req.body.phone  }
                    ]
                }
            });

            if(user)   res.status(422).json({success : false, message:"user with given phone/email already exists", data: null});

            if( !user ) {

                const { ENCRYPTION_KEY, AUTH_TOKEN_KEY } = process.env;

                const passwordHash = await bcrypt.hash(req.body.password, ENCRYPTION_KEY!);

                user =  await prisma.user.create({
                    data: {...req.body, password:passwordHash }
                });

                const jwtOptions = {
                    expiresIn: '24h',  // Expire token in 24 hours
                };
            
                const authToken = jwt.sign(user, AUTH_TOKEN_KEY!, jwtOptions);

                const { first_name, last_name, email, phone, id } = user;

                await prisma.personalAccessToken.create({
                    data: { user_id:id, token:authToken, device_id: req.body.device_id ?? null }
                });

                res.json({success : true, message: 'User Has Been Registered Successfully', data : { id,first_name, last_name, email,phone, _token: authToken}});
            }
           
        }
        
    }
}

export const registerController = new RegisterController();
