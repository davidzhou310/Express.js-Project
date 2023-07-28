const catchAsync = require("../utils/catchAsync");
const appError = require("./../utils/appError");
const getQuery = require("./../utils/getQuery");

exports.deleteOne = model => {
    return catchAsync( async (req, res, next) => {
        const doc = await model.findByIdAndDelete(req.params.id);
    
        if (!doc) {
            return next(new appError("no document found", 404));
        }
    
        res.status(204).json({
            status: "success"
        });
    });
}

exports.updateOne = model => {
    return catchAsync( async (req, res, next) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
    
        if (!doc) {
            return next(new appError("no doc found", 404));
        }
    
        res.status(200).json({
            status: "success",
            data: {
                data: doc
            }
        });
    });
}

exports.createOne = model => {
    return catchAsync( async (req, res, next) => {
        const doc = await model.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                data: doc
            }
        });
    });
}

exports.getOne = (model, populateOptions) => {
    return catchAsync( async (req, res, next) => {
        let query = model.findById(req.params.id);
        if (populateOptions){
            query = query.populate(populateOptions);
        }

        const doc = await query;

        if (!doc) {
            return next(new appError("no doc found", 404));
        }

        res.status(200).json({
            status: "success", 
            data: {
                data: doc
            }
        });
    });
}

exports.getAll = model => {
    return catchAsync(async (req, res, next) => {
        let filter;
        if (req.params.tourId) {
            filter = { tour: req.params.tourId }
        }

        const query = new getQuery(model.find(filter), req.query)
            .filter()
            .sort()
            .setField()
            .paginate();
    
        const doc = await query.query;
        
        res.status(200).json({
            status: "success",
            result: doc.length,
            data: {
                data: doc
            }
        });
    });
}