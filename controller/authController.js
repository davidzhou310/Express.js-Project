const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const catchAsync = require("./../utils/catchAsync");
const User = require("./../model/userModel");
const appError = require("./../utils/appError");
const Email = require("./../utils/email");

const signToken = id => {
    return jwt.sign( { id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const sentToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === "production") {
        cookieOptions.secure = true;
    }

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync( async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    const url = `${req.protocol}://${req.get("host")}/me`;
    await new Email(user, url).sendWelcome();
    sentToken(user, 201, res);
});

exports.login = catchAsync( async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return next(new appError("please enter email or password"), 400);
    }

    const user = await User.findOne({email}).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new appError("incorrect email or password", 401));
    }

    sentToken(user, 200, res);
});

exports.protect = catchAsync( async (req, res, next) => {
    // 1) get the token and check token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new appError("You are not logged in"), 401);
    }

    // 2) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new appError("The user belonging to this token does not exist", 401));
    }

    // 4) check user changed password
    if (await (freshUser.ifChangedPassword(decoded.iat))) {
        return next(new appError("User changed password recently. Please login again"), 401);
    }

    //grant access to proected route
    req.user = freshUser;
    res.locals.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError("You do not have permission to perform this action", 403));
        }

        next();
    }
}

exports.forgetPassword = catchAsync( async (req, res, next) => {
    // 1) get user based on email
    const user = await User.findOne( {email: req.body.email });
    if (!user) {
        return next(new appError("There is no user corresponding to this email", 404));
    }

    // 2) generate random token
    const token = await user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 3) send back by email 
    try {
        const url = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${token}`;
        await new Email(user, url).sendPasswordReset();
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpired = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new appError("There was an error sending the email. Try again later", 500));
    }

    res.status(200).json({
        status: "success",
        message: "token send to email"
    });
});

exports.resetPassword = catchAsync (async (req, res, next) => {
    // 1) get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetTokenExpired: { $gt: Date.now() }
    });

    // 2) if token not expired, set new password
    if (!user) {
        return next(new appError("Token is invalid or has expired", 400));
    }

    // 3) update property
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpired = undefined;

    await user.save();

    // 4) log user in
    sentToken(user, 200, res);
});

exports.updatePassword = catchAsync (async (req, res, next) => {
    // 1) get user
    const user = await User.findById(req.user._id).select("+password");

    // 2) check posted password is correct
    if (!(await user.correctPassword(req.body.curPassword, user.password))){
        return next(new appError("Your password is wrong", 401));
    }

    // 3) if correct, then update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;

    console.log(user.password);
    console.log(user.passwordConfirm);

    await user.save();

    // 4) log user in 
    sentToken(user, 200, res);
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            const freshUser = await User.findById(decoded.id);
            if (!freshUser) {
                return next();
            }

            if (await (freshUser.ifChangedPassword(decoded.iat))) {
                return next();
            }
            
            //There is a logged in user, send a variable to template
            res.locals.user = freshUser;
        } catch (err){
            return next();
        }
    }
    next();
};

exports.logout = (req, res) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10000),
        httpOnly: true
    });

    res.status(200).json({
        status: "success"
    });
}