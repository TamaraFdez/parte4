const blogRouter = require('express').Router()
const Blog = require('../models/blog')

// Ruta para obtener todos los blogs
blogRouter.get('/', async (request, response) => {
  try {
    const blogs = await Blog.find({})
    response.json(blogs)
  } catch (error) {
    response.status(500).json({ error: 'Error al obtener los blogs' })
  }
})

blogRouter.post('/', async (request, response) => {
  const body = request.body

  if (!body.title ||!body.author ||!body.url) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' })
  }

  try {
    const newBlog = new Blog(body)
    const savedBlog = await newBlog.save()
    response.status(201).json(savedBlog)
  } catch (error) {
    response.status(500).json({ error: 'Error al guardar el blog' })
  }
})

module.exports = blogRouter

  