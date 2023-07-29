const dotenv = require("dotenv");
dotenv.config({"path": "./config.env"});

process.on("uncaughtException", err => {
    console.log(`uncaught err ${err.name}: ${err.stack}`);
    process.exit(1);
});

const app = require("./app");
const mongoose = require("mongoose");

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

const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`listening to ${port}...`);
});

//handle all uncatched rejection
process.on("unhandledRejection", err => {
    console.log(`unhandled rejection ${err.name}: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});