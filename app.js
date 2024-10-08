const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const blogRouter = require('./controllers/blogRouter')
const usersRouter = require('./controllers/usersRouter')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const login = require('./controllers/login')


mongoose.set('strictQuery', false)


mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
//app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)


app.use('/api/blogs', blogRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', login)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app