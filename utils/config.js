
require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.URI_DB

module.exports = {
  MONGODB_URI,
  PORT
}