const Review = require("./../model/reviewModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getReviewByUser = catchAsync( async (req, res, next) => {
    const user = req.params.userId;
    const reviews = await Review.find({ user: user });

    res.status(200).json({
        status: "success",
        data: {
            reviews
        }
    });
});

exports.createReview = catchAsync( async (req, res, next) => {
    const reviews = await Review.create({
        review: req.body.review,
        rating: req.body.rating,
        user: req.user.id,
        tour: req.params.tourId
    });

    res.status(201).json({
        status: "success",
        data: {
            reviews
        }
    });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);



