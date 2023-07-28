const Tour = require("./../model/tourModel");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");

exports.getOverview = catchAsync( async (req, res, next) => {
    // 1) get tour data from collections
    const tours = await Tour.find();

    // 2) Build template (not in controller)
    // 3) render template 
    res.status(200).render("overview", {
        title: "All Tours",
        tours
    });
});

exports.getTour = catchAsync( async (req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate({
        path: "reviews",
        fields: "review rating user"
    });

    if (!tour) {
        return next(new appError("There is no tour with this name", 404));
    }

    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render("tour", {
            title: `${tour.name} Tour`,
            tour
        });
});

exports.getLoginPage = catchAsync( async (req, res, next) => {
    res.status(200)
        .set({
            "Content-Security-Policy": "script-src 'self' cdn.jsdelivr.net;"
        })
        .render("login", {
            title: "user login"
        });
});

exports.getSignUpPage = catchAsync( async (req, res, next) => {
    res.status(200).render("signUp", {
        title: "sign up"
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render("account", {
        title: "Your Account"
    });
}