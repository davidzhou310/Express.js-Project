const multer = require("multer");
const sharp = require("sharp");

const catchAsync = require("./../utils/catchAsync");
const User = require("./../model/userModel");
const appError = require("./../utils/appError");
const factory = require("./handlerFactory");


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

const filterObj = (obj, ...filter) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (filter.includes(el)) {
            newObj[el] = obj[el].trim();
        }
    });

    return newObj;
}

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto =  catchAsync( async (req, res,next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/image/users/${req.file.filename}`);

    next();
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) create error if user pst password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new appError("This route is not for updating password. Please use /updatePassword", 400));
    }

    // 2) filtered out unwanted field names that are not allow to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) update document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true, 
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync (async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, {active: false});

    res.status(204).json({
        status: "success",
        data: null
    });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);