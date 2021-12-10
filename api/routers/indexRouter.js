const express = require('express');
const authRouter = require('./authRouter');
const userRouter = require('./userRouter');
const postRouter = require('./postRouter');
const profileRouter = require('./profileRouter');
const indexRouter = express();

// .../api/...

indexRouter.use('/auth', authRouter);
indexRouter.use('/users', userRouter);
indexRouter.use('/posts', postRouter);
indexRouter.use('/profile', profileRouter);

module.exports = indexRouter;