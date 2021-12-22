const express = require('express');
const dotenv = require('dotenv');
const connectDatabase = require('./api/helpers/databaseHelpers/connectDatabase');
const customErrorHandler = require('./api/middlewares/errorMiddlewares/customErrorHandler');
const indexRouter = require('./api/routers/indexRouter');
const morgan = require('morgan')
const app = express();

var cookieParser = require('cookie-parser')
app.use(cookieParser())

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/*********************** ***********************/
const path = require('path');
dotenv.config({ path: "./api/config/config.env" });

connectDatabase();
app.use(express.json());
app.use(morgan('dev'))

const PORT = process.env.PORT;
/*********************** ***********************/
//Routes
app.use("/api/v1", indexRouter);
app.use(customErrorHandler);

app.listen(PORT, () => {
    console.log(`App Started On ${PORT} : ${process.env.NODE_ENV}`);
});