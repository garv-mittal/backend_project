import multer from "multer";

const storage = multer.diskStorage(
    {
        //destination , where the file will be stored
        destination: function (req,file,cb) {
            cb(null,"./public/temp");
        },
        //name with which the file will be saved
        filename:function (req,file,cb) {
            cb(null,file.originalname)
        }
    }
)


export const upload = multer(
    {
        storage,
    }
)