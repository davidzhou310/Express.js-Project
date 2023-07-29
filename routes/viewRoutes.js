const express = require("express");

const viewsController = require("./../controller/viewsController");
const authController = require("./../controller/authController");

const Router = express.Router();

//render template

Router.get("/",authController.isLoggedIn , viewsController.getOverview);
Router.get("/tour/:slug",authController.isLoggedIn, viewsController.getTour);
Router.get("/login",authController.isLoggedIn, viewsController.getLoginPage);
Router.get("/signup", viewsController.getSignUpPage);
Router.get("/me", authController.protect, viewsController.getAccount);

module.exports = Router;