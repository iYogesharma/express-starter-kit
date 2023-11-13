import { File } from "buffer";
import { Request } from "./app"
import fs  from 'fs';

export const imageValidator = (req: Request, files:any) => {
    let valid = true;
    if( files ) {
        files.forEach( ( file : any ) => {
            const mimes = ['image/jpeg','image/jpg','image/png','image/ico','image/gif'];
            valid = mimes.includes(file.mimetype)
            if( !valid ) { 
                return false;
            }
        })
       
        if( !valid ){
            removeFiles(files)
            return valid
        } 
        else {
          
            files.forEach( ( file : any ) => {
              req.body[file.fieldname] = file.path
            })
            return valid
        }
    } else {
        return false;
    }
}

export const removeFiles = async ( files: File[] | any ) => {
    await files.forEach( ( file : any ) => {
        fs.unlinkSync(file.path)
    })
}

export const removeFilesAtPath = async ( files : Array<any>) =>  {
    await files.forEach( ( file : any ) => {
        if( file ){
            fs.unlinkSync(file)
        }
    })
}