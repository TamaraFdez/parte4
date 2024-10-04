const usersRouter = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');



usersRouter.get('/', async (request, response) => {
  try {
    const users = await User.find({}).populate('Blogs'); 
    response.json(users);
  } catch (error) {
    response.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});


usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

 
  if (!username || username.length < 3) {
    return response.status(400).json({ error: 'El username debe tener al menos 3 caracteres' });
  }
  
  if (!password || password.length < 3) {
    return response.status(400).json({ error: 'La contraseña debe tener al menos 3 caracteres' });
  }

 
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return response.status(400).json({ error: 'El username ya existe' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

module.exports = usersRouter;

