const mongoose = require("mongoose");

const Tour = require("./tourModel");

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, "review cannot be empty"],
        maxlength: [500, "a review cannot be more than 500 characters"],
    },
    rating: {
        type: Number,
        required: [true, "a rating is needed to create a review"],
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "review must belong to a user"]
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, "review must belong to a tour"]
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtual: true}
});

//one use can write one review for the same tour
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path: "user",
        select: "name photo"
    });

    next();
});

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: "$tour",
                nRatings: { $sum: 1 },
                avgRating: { $avg: "$rating"}
            }
        }
    ]);

    if (stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRatings,
            ratingAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingAverage: 4.5
        });
    }
}

reviewSchema.post("save", async function(doc){
    await doc.constructor.calcAverageRatings(doc.tour);
});

reviewSchema.post(/^findOneAnd/, async function(doc){
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

module.exports = mongoose.model("Review", reviewSchema);