import {validationResult}  from 'express-validator'

import { Request, Response} from "../app";

export default abstract class Controller {

    /**
     * validate user input in request 
     *  and return response accordingly
     */
    public validate = async  (validations : Array<any>, req : Request, res : Response)  => {
        
        for (let validation of validations) {
            await validation.run(req);
        }
      
        const errors = validationResult(req);
       
        if (errors.isEmpty()) {
            return true;
        } else {
            res.status(422).json({ success: false, message:"Validation Failure", ...errors});
            return false;
        }
    }
}