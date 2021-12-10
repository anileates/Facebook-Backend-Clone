const express = require('express');
const dotenv = require('dotenv');
const connectDatabase = require('./api/helpers/databaseHelpers/connectDatabase');
const customErrorHandler = require('./api/middlewares/errorMiddlewares/customErrorHandler');
const indexRouter = require('./api/routers/indexRouter');

const app = express();

var cookieParser = require('cookie-parser')
app.use(cookieParser())

/*********************** ***********************/
const path = require('path');
dotenv.config({path: "./api/config/config.env"});

connectDatabase();
app.use(express.json());
    
const PORT = process.env.PORT;
/*********************** ***********************/

//Routes
app.use("/api", indexRouter);
app.use(customErrorHandler);

/*********************** STATIC FILES ***********************/
app.use(express.static(path.join(__dirname, "public")));

app.set('views',  path.join(__dirname, 'front','views'));
app.set('view engine', 'ejs');
/************************************************************/

app.listen(PORT, () => {
    console.log(`App Started On ${PORT} : ${process.env.NODE_ENV}`);
});