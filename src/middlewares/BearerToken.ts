import { NextFunction} from "express";
import { Request, Response} from "../app";
import jwt from 'jsonwebtoken';

export const BearerToken =  ( req : Request, res: Response, next: NextFunction ) => {
    
    const authorization = req.header("Authorization");

    if( !authorization || !authorization.startsWith("Bearer "))
    {
        res.status(401).json({success:false, data:null, message: "Invalid authorization header"});
    }
    else 
    {
        const token = authorization.replace("Bearer ", "");

        if( !token )
        {
            res.status(401).json({success:false, data:null, message: "Authorization token not found"});
        }
        else 
        {
            try {
                const { AUTH_TOKEN_KEY } = process.env;
                const decoded = jwt.verify(token, AUTH_TOKEN_KEY!);
                req.user = decoded;
                next();
              } catch (err) {
                return res.status(401).json({ success: false, data:null, message: "Invalid token" });
              }
        }
    }
}