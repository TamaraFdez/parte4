
const bcrypt = require('bcrypt');
const User = require('../models/user');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const helper = require('../utils/test_helper');
const { test, before, after } = require('node:test');
const assert = require('node:assert');

const api = supertest(app);


before(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash('sekret', 10);
    initialUsers = [
      { username: 'root', passwordHash },
      { username: 'testuser', passwordHash },
    ];
    
    await User.insertMany(initialUsers);
  });
  
  after(async () => {
    await mongoose.connection.close();
  });
  test('la creación falla si el username ya existe', async () => {
    const newUser = {
      username: 'root', 
      name: 'Otro Usuario',
      password: 'salainen',
    };
  
    const response = await api.post('/api/users').send(newUser).expect(400);
    
    assert.strictEqual(response.body.error, 'El username ya existe');
  });

test('la creación falla si el username tiene menos de 3 caracteres', async (t) => {
  const usersAtStart = await helper.usersInDb();

  const newUser = {
    username: 'ro', 
    name: 'Short User',
    password: 'salainen',
  };

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400) 
    .expect('Content-Type', /application\/json/);

  assert.strictEqual(result.body.error, 'El username debe tener al menos 3 caracteres');

  const usersAtEnd = await helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length); 
});

test('la creación falla si la contraseña tiene menos de 3 caracteres', async () => {
  const newUser = {
    username: 'user',
    name: 'User Name',
    password: 'ab', 
  };

  const response = await api.post('/api/users').send(newUser).expect(400);
  
 
  assert.strictEqual(response.body.error, 'La contraseña debe tener al menos 3 caracteres');
});


test('la creación tiene éxito con un username y contraseña válidos', async (t) => {
  const usersAtStart = await helper.usersInDb();

  const newUser = {
    username: 'validuser',
    name: 'Valid User',
    password: 'validpassword',
  };

  await api
    .post('/api/users')
    .send(newUser)
    .expect(201) 
    .expect('Content-Type', /application\/json/);

  const usersAtEnd = await helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1); 

  const usernames = usersAtEnd.map(u => u.username);
  assert(usernames.includes(newUser.username)); 
});


after(async () => {
  await mongoose.connection.close();
});
