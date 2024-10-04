const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user'); 
const { tokenExtractor, userExtractor } = require('../utils/middleware');

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .populate('creator', { username: 1, name: 1 }) 
    .exec();
  response.json(blogs);
});

blogRouter.get('/:id', async (request, response) => {
  const { id } = request.params;

  const blog = await Blog.findById(id).populate('creator', { username: 1, name: 1 });
  if (!blog) {
    return response.status(404).json({ error: 'Blog not found' });
  }
  response.json(blog);
});

blogRouter.post('/', tokenExtractor, userExtractor, async (request, response) => {
  const body = request.body;

  if (!body.title || !body.author || !body.url) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' });
  }

  const newBlog = new Blog({ ...body, creator: request.user.id });

  try {
    const savedBlog = await newBlog.save();
   
    const user = await User.findById(request.user.id);
    user.Blogs.push(savedBlog._id);
    await user.save();

    response.status(201).json(savedBlog);
  } catch (error) {

    return response.status(500).json({ error: 'Error al guardar el blog: ' + error.message });
  }
});


blogRouter.put('/:id', tokenExtractor, userExtractor, async (request, response) => {
  const { id } = request.params;
  const body = request.body;

  if (!body.title || !body.author) {
    return response.status(400).json({ error: 'El título y el autor son obligatorios' });
  }

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('creator', { username: 1, name: 1 });

    if (!updatedBlog) {
      return response.status(404).json({ error: 'Blog not found' });
    }

    response.json(updatedBlog);
  } catch (error) {
   
    if (error.name === 'CastError') {
      return response.status(400).json({ error: 'malformatted id' });
    } else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message });
    }
    
    response.status(500).json({ error: 'Error al actualizar el blog: ' + error.message });
  }
});

blogRouter.delete('/:id', tokenExtractor, userExtractor, async (request, response) => {
  const id = request.params.id;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' });
    }

    if (blog.creator.toString() !== request.user.id) {
      return response.status(403).json({ error: 'No tienes permisos para eliminar este blog' });
    }

    await Blog.findByIdAndDelete(id);
    response.status(204).end();
  } catch (error) {
    if (error.name === 'CastError') {
      return response.status(400).json({ error: 'malformatted id' });
    }
    response.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = blogRouter;



  