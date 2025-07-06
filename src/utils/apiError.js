//custom error class called ApiError that extends the built-in Error class
class ApiError extends Error{
    constructor(
        statusCode,                                 //for http status
        message="Some error occurred",
        errors=[],                                  //optional array for detailed array msgs
        stack=""                                    //helps in debugging

    ){
        super(message)
        this.statusCode=statusCode
        this.message=message
        this.data=null
        this.errors=errors
        this.success=false

        if(stack)
        {   this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}


export {ApiError};


/* example usage of this class

throw new ApiError(400, "Validation failed", [
  { field: "email", message: "Email is required" },
  { field: "password", message: "Password too short" }
]);

*/