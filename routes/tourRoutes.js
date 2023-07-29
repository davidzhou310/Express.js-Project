const express = require("express");
const tourController = require("./../controller/tourController");
const authController = require("./../controller/authController");

const reviewRouter = require("./reviewRoutes");

//create router
const Router = express.Router();

Router.use("/:tourId/reviews", reviewRouter);

Router.route("/")
    .get(tourController.getAllTours)
    .post(authController.protect, 
        authController.restrictTo("lead-guide", "admin"),
        tourController.createTour
    );

Router.route("/top-5")
    .get(tourController.alias_topTours, tourController.getAllTours);

Router.route("/tour-stats")
    .get(tourController.getTourStats);

Router.route("/get-plan/:year")
    .get(authController.protect, 
        authController.restrictTo("lead-guide", "admin", "guide"),
        tourController.getMonthlyPlan
    );

Router.route("/tours-within/:distance/center/:latlng/unit/:unit")
    .get(tourController.getTourWithin);

Router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

Router.route("/:id")
    .get(tourController.getTour)
    .patch(authController.protect, 
        authController.restrictTo("lead-guide", "admin"),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect, 
        authController.restrictTo("admin", "lead-guide"), 
        tourController.deleteTour
    );

module.exports = Router;