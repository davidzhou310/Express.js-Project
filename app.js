const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const errorHandler = require("./controller/errorController");
const appError = require("./utils/appError");

const app = express();

//set template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, 'views'));

// ###   global middleware stack ### 

//serving static files 
app.use(express.static(path.join(__dirname, "public")));

//security http header
app.use(helmet());

//limit requests from same API
const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: "too many request from this IP. Please try again later" 
});
app.use("/api", limiter);

//body parser, reading data from body into req.body and limit data amount (prevent DOT attack)
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

//data sanitization against NoSQL Query Injection 
app.use(mongoSanitize());

//data sanitization against Cross-Site Attack (XSS)
app.use(xss());

//prevent parameter pollution (ex: two sort)
app.use(hpp({
    whitelist: [
        "duration",
        "ratingQuantity",
        "ratingAverage",
        "maxGroupSize",
        "difficulty",
        "price"
    ]
}));

app.use(compression());

//  ### mount routers ###

//rountes 
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

//wrong router handler
app.all("*", (req, res, next) => {
    const err = new appError(`${req.originalUrl} cannot found`, 404);
    next(err);
});

//error handler
app.use(errorHandler);

module.exports = app;