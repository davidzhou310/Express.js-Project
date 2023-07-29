const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Tour = require("./../../model/tourModel");
const User = require("./../../model/userModel");
const Review = require("./../../model/reviewModel");

dotenv.config({"path": "./config.env"});

const DB = process.env.DATABASE
    .replace("<PASSWORD>", process.env.PASSWORD)
    .replace("<USERNAME>", process.env.USERNAME);

mongoose.connect(DB, {
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(() => {
    console.log("db connection successful");
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

const importData = async() => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("data successfully loaded");
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

const deleteData = async() => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("data successfully deleted");
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}
