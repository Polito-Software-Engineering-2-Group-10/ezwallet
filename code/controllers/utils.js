import jwt from 'jsonwebtoken'

function isNumeric(num){
    return !isNaN(num);
}

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => { 

    // To use handleDate you have to pass three values (or only date or the others two):
    // date if you want all transaction of a particular date with the format YYYY-MM-DD
    // from if you want all transactions the date starting from the date in from
    // upTo if you want all transactions until upTo

    const {date, from, upTo} = req.query;
    let matchObj={date : {}};
    const endDay = "T23:59:59.999Z";
    if(date && (from || upTo)){
        throw new Error("It includes only one parameter of from and upTo with date");
    }
    if (!date && !from && !upTo){
        return {};
    }
    if(date){
        const new_date = new Date(date);
        if(new_date.toString() === 'Invalid Date') throw new Error("Invalid format for date");
        matchObj.date.$gte = new Date(date);
        matchObj.date.$lte = new Date(date+endDay);
        return matchObj;
    }
    if(from){
        const new_from = new Date(from);
        if(new_from.toString() === 'Invalid Date') throw new Error("Invalid format for from");
        matchObj.date.$gte = new Date(from);
    }if(upTo){
        const new_upTo = new Date(upTo);
        if(new_upTo.toString() === 'Invalid Date') throw new Error("Invalid format for upTo");
        matchObj.date.$lte = new Date(upTo+endDay);
    }

    return matchObj;
    

}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { flag: false, cause: "Unauthorized" };
    }
    try {
        
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { flag: false, cause: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { flag: false, cause: "Mismatched users" };
        }
        
        switch(info.authType){
            case "User":
                // -- authType == "User"
                if( decodedAccessToken.username !== info.username )
                    return { flag : false, cause: "The username of the cookie and that one you provide don't match" };
                break;
            case "Admin":
                //-- authType == "Admin"
                if ( decodedAccessToken.role !== "Admin")
                    return { flag : false, cause : "The user must be an Admin" };
                break;
            case "Group":
                //-- authType == "Group"
                if ( info.emails.indexOf(decodedAccessToken.email) == -1 )
                    return { flag : false, cause : "The email of the token doesn't match"};
                break;
                case "Simple":
                //-- authType == "Simple"
                break;
            default:
                return { flag : false, cause: "You must specify a valid authType"}
        }
        return { flag: true, cause: "Authorized" }
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.message = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                switch(info.authType){
                    case "User":
                        // -- authType == "User"
                        if( refreshToken.username !== info.username )
                            return { flag : false, cause: "The username of the cookie and that one you provide don't match" }
                        break;
                    case "Admin":
                        //-- authType == "Admin"
                        if ( refreshToken.role !== "Admin")
                            return { flag : false, cause : "The user must be an Admin" };
                        break;
                    case "Group":
                        //-- authType == "Group"
                        if ( info.emails.indexOf(refreshToken.email) == -1 )
                            return { flag : false, cause : "The email of the token doesn't match"};
                        break;
                    case "Simple":
                        //-- authType = "Simple"
                        break;
                    default:
                        return { flag : false, cause: "You must specify the authType"}
                }
                return { flag: true, cause: "Authorized" };
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    return { flag: false, cause: "Perform login again" }
                } else {
                    return { flag: false, cause: err.name }
                }
            }
        } else {
            return { flag: false, cause: err.name };
        }
    }
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
    const {min, max} = req.query;
    let matchObj = {amount:{}}

    if(!min && !max){
        return {}
    }

    if (min){
        if(!isNumeric(min)) throw new Error("Min must be an integer");
        matchObj.amount.$gte = parseInt(min);
    } if (max){
        if(!isNumeric(max)) throw new Error("Max must be an integer");
        matchObj.amount.$lte = parseInt(max);
    }


    return matchObj;

}