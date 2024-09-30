const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user'); 

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

blogRouter.post('/', async (request, response) => {
  const body = request.body;

  if (!body.title || !body.author || !body.url) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' });
  }

 
  const user = await User.findOne({}); 
  if (!user) {
    return response.status(400).json({ error: 'No se encontró un usuario' });
  }

  // Crea el nuevo blog
  const newBlog = new Blog({ ...body, creator: user._id });
  const savedBlog = await newBlog.save();

  // Agrega el ID del nuevo blog al array Blogs del usuario
  user.Blogs.push(savedBlog._id);
  await user.save(); 

  response.status(201).json(savedBlog);
});


blogRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const body = request.body;

  if (!body.title || !body.author) {
    return response.status(400).json({ error: 'El título, el autor y la URL son obligatorios' });
  }

  const updatedBlog = await Blog.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    .populate('creator', { username: 1, name: 1 }); 

  if (!updatedBlog) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  response.json(updatedBlog);
});

blogRouter.delete('/:id', async (request, response) => {
  const id = request.params.id;

  const deletedBlog = await Blog.findByIdAndDelete(id);

  if (!deletedBlog) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  response.status(204).end();
});

module.exports = blogRouter;



  