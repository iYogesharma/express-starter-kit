import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, Date.now() + Math.round(Math.random() * 1E9 ) + '_' + file.originalname);
    }
});

const multerFilter = (req : any, file : any , cb:any) => {
    const ext = ['jpeg','jpg','png','ico','gif','pdf','csv','xls','xlsx'];
    if (ext.includes(file.mimetype.split("/")[1] )) {
      cb(null, true);
    } else {
      cb(new Error("Not a valid File Extension!!"), false);
    }
};

export const upload = multer({ storage: storage,fileFilter: multerFilter })