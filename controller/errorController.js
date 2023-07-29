const appError = require("./../utils/appError");

const castErrorHandlerDB = err => {
    const message = `invalid ${err.path}: ${err.value}`;
    return new appError(message, 400);
}

const validatorErrorHandlerDB = err => {
    const messages = Object.values(err.errors).map(el => {
        return el.message;
    })
    return new appError(messages.join('/ '), 400);
}

const DuplicateKeyHandlerDB = err => {
    const value = err.keyValue.name;
    const message = `duplicate field value ${value}`;
    return new appError(message, 400);
}

const JWTErrorhandler = err => 
    new appError("Invalid token. Please login again", 401);

const JWTExpriedErrorHandler = err => 
    new appError("Your token has expired, please login again", 401);


const sendErrDev = (req, res, err) => {
    //API
    if (req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            error: err,
            status: err.status,
            message: err.message,
        });
    } else {
    // RENDERED WEBSITE
        console.log(err);
        res.status(err.statusCode).render("error", {
            title: "Something Went Wrong",
            message: err.message
        });
    }
}

const sendErrProd = (req, res, err) => {
    // For API
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            console.error("err: ", err);
    
            res.status(500).json({
                status: "error",
                message: "somethings went wrong"
            });
        }
    } else {
    // For website
        if (err.isOperational) {
            res.status(err.statusCode).render("error", {
                title: "Something Went Wrong",
                message: err.message
            });
        } else {
            console.log(err);
            res.status(err.statusCode).render("error", {
                title: "Something Went Wrong",
                message: "Please try again later"
            });
        }
    }
}

module.exports = (err, req, res, next) => {
    err.status = err.status || "error";
    err.statusCode = err.statusCode || 500;
    
    if (process.env.NODE_ENV === "development") {
        sendErrDev(req, res, err);
    } else if (process.env.NODE_ENV === "production") {
        let error;
        if (err.name === "CastError") {
            error = castErrorHandlerDB(err);
        }
        else if (err.code === 11000) {
            error = DuplicateKeyHandlerDB(err);
        }
        else if (err.name === "ValidationError") {
            error = validatorErrorHandlerDB(err);
        }
        else if (err.name === "JsonWebTokenError") {
            error = JWTErrorhandler(err);
        }
        else if (err.name === "TokenExpiredError") {
            error = JWTExpriedErrorHandler(err);
        }
        else {
            error = err;
        }
        sendErrProd(req, res, error);
    }
    next();
}