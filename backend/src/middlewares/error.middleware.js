
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.statusCode ? err.message : "Something went wrong";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)[0].message;
    } else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    } else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    } else if (err.code === 11000) {
        statusCode = 409;
        message = "Username or email already in use";
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID";
    }

    if (statusCode === 500) console.error(err);

    res.status(statusCode).json({ success: false, message });
};