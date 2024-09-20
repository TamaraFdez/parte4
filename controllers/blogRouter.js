const blogRouter = require('express').Router()
const Blog = require('../models/blog')


blogRouter.get('/', async (request, response) => {
  
    const blogs = await Blog.find({})
    response.json(blogs)

})
blogRouter.get('/:id', async (request, response) => {
  const { id } = request.params;

      const blog = await Blog.findById(id);
      if (!blog) {
          return response.status(404).json({ error: 'Blog not found' });
      }
      response.json(blog);
 
});

blogRouter.post('/', async (request, response) => {
  const body = request.body

  if (!body.title ||!body.author ||!body.url) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' })
  }

    const newBlog = new Blog(body)
    const savedBlog = await newBlog.save()
    response.status(201).json(savedBlog)
  
})

blogRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const body = request.body;

  if (!body.title ||!body.author) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' })
  }
  const updatedBlog = await Blog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  
  if (!updatedBlog) {
      return response.status(404).json({ error: 'Blog not found' });
  }

  response.json(updatedBlog);
});


blogRouter.delete('/:id', async (request, response) => {
  const id  = request.params.id


    const deletedBlog = await Blog.findByIdAndDelete(id)

    if (!deletedBlog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    response.status(204).end() 
})


module.exports = blogRouter

  