/*If the requestHandler throws an error or returns a rejected promise,
it gets caught using catch(err) and passed to next(err) — which is how Express handles errors.*/

const asyncHandler = (requestFunction) => {
    return (req,res,next) => {
        Promise.resolve(requestFunction(req,res,next))
        .catch((err)=> next(err))                       
    }
}



export {asyncHandler};


//alternate way to write this function: (doesnt use express's default error handling)

// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }