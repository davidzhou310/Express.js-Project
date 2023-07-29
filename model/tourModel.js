const mongoose = require("mongoose");
const slugify = require("slugify");

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "a tour must have a name"],
        unique: true,
        trim: true,
        maxlength: [40, "a tour name must have <= 40 characters"],
        minlength: [10, "a tour name must have >= 10 characters"],

    },
    duration: {
        type: Number,
        required: [true, "a tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "a tour must have a group size"]
    },
    difficulty: {
        type: String,
        required: [true, "a tour should have a difficulty"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "difficulty must be either: easy, medium, difficult"
        }
    },
    ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1, "rating must be above 1.0"],
        max: [5, "rating must be below 5.0"],
        set: val => Math.round(val * 10) / 10 
    },
    ratingQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "a tour must have a price"]
    },
    slug: String,
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                return val < this.price;
            },
            message: "discount price ({VALUE}) should be lower than the price"
        }
    },
    summary: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: [true, "a tour must have a description"]
    },
    imageCover: {
        type: String,
        required: [true, "a tour must have a image cover"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    }, 
    startLocation: {
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: "Point",
                enum: ["Point"],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ]
}, {
    toJSON: {virtuals: true},
    toObject: {virtual: true}
});

//set (compound) index to boost query performance
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

//virtual populate
tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id",
});

tourSchema.pre("save", function(next){
    this.slug = slugify(this.name);
    next();
});

//query middleware
tourSchema.pre(/^find/, function(next){
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt"
    });

    next();
});

tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true }});
    next();
});

module.exports = mongoose.model("Tour", tourSchema);