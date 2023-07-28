const multer = require("multer");
const sharp = require("sharp");

const Tour = require("./../model/tourModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const appError = require("./../utils/appError");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new appError("Not an image. Please upload only image", 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

//process multiple image upload
exports.uploadTourImages = upload.fields([
    {name: "imageCover", maxCount: 1},
    {name: "image", maxCount: 3}
]);

exports.resizeTourImages = catchAsync( async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/image/tours/${req.body.imageCover}`);

    // 2) images
    req.body.images = [];
    await Promise.all(
        req.files.images.map( async (file, idx) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`public/image/tours/${filename}`);
            req.body.images.push(filename);
        })
    );
    next();
});

exports.alias_topTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = "price, -ratingAverage";
    req.query.fields = "name, price, ratingAverage, summary, difficulty";

    next();
}

//route handlers 
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {
    path: "review",
    select: "-__v"
});
exports.createTour = factory.createOne(Tour);
//do not update password 
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync( async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingAverage: {$gte: 4.5}}
        },
        {
            $group: {
                _id: {$toUpper: "$difficulty"},
                num: {$sum: 1},
                avgRating: {$avg: "$ratingAverage"},
                avgPrice: {$avg: "$price"},
                minPrice: {$min: "$price"},
                maxPrice: {$max: "$price"}
            }
        }, 
        {
            $sort: {avgPrice: 1}
        }
    ])
    res.status(200).json({
        status: "success",
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync( async (req, res, next) => {
    const year = req.params.year;
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: "$startDates"},
                numOfTourStarts: {$sum: 1},
                tours: {$push: "$name"}
            }
        },
        {
            $addFields: {
                month: "$_id"
            }
        }, 
        {
            $project: {
                _id: 0
            }
        }, 
        {
            $sort: {
                numOfTourStarts: -1
            }
        },
        {
            $limit: 6
        }
    ])

    res.status(200).json({
        status: "success",
        data: {
            plan
        }
    });
});

exports.getTourWithin = catchAsync( async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');
    
    if (!lat || !lng) {
        return next(new appError("please provide latitute and longitude in the format lat,lng.", 400));
    }

    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    const tour = await Tour.find({ 
        startLocation: { 
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    });

    res.status(200).json({
        status: "success",
        results: tour.length,
        data: {
            data: tour
        }
    });
});

exports.getDistances = catchAsync( async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');
    
    if (!lat || !lng) {
        return next(new appError("please provide latitute and longitude in the format lat,lng.", 400));
    }

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            },
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: "success",
        data: {
            data: distances
        }
    })
});

