import prisma from "../prisma";
import jwt from 'jsonwebtoken';
import Log from "../logger";

/**
 * Logs a user into the application based on 
 * provided user id
 * @param id 
 * @param device_id 
 * @returns bool|personalAccessToken
 */
export const loginUserById = async ( id : any, device_id: string | undefined ) => {
    const user  = await prisma.user.findUnique({
        where : {
            id:id
        },
        select : {
            id: true,
            first_name:true,
            password:true,
            email:true,
            phone:true,

        }
    });

    if( !user ) return false;
    else {
        return login( user , device_id );
    } 
}


/**
 * Logs a user into the application
 * @param user User
 * @param device_id 
 * @returns bool|personalAccessToken
 */
export const login = async ( user : any, device_id: any ) => {
    if( !user ) return false;
    else {
        const jwtOptions = {
            expiresIn: '24h',  // Expire token in 24 hours
        };
      
        const { AUTH_TOKEN_KEY } = process.env;

        const { id, first_name, email, phone } = user;

        const authToken = jwt.sign({first_name, id, email, phone}, AUTH_TOKEN_KEY!, jwtOptions);

        try {
       
            const personalAccessToken = await prisma.personalAccessToken.upsert({
                where: { 
                    user_id:id, 
                    device_id: device_id ?? ""
                },
                update: {
                    device_id: device_id,
                    token:authToken,
                },
                create: {
                    user_id:id, 
                    token:authToken,
                    device_id: device_id
                }
            });

            return personalAccessToken;
        } catch( er ){
            Log.info( "Error in login function in file "+ __filename+ ":-"+ er);
            return false
        }
    } 
}