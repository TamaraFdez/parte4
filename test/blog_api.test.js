const { test, after, before } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const jwt = require('jsonwebtoken');

const api = supertest(app);

before(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});

  const user1 = new User({ username: 'user1', passwordHash: 'hashedpassword1' });
  const user2 = new User({ username: 'user2', passwordHash: 'hashedpassword2' });

  await user1.save();
  await user2.save();

  const initialBlogs = [
    { title: 'Test Blog 1', author: 'Author 1', url: 'http://example1.com', likes: 1, creator: user1._id },
    { title: 'Test Blog 2', author: 'Author 2', url: 'http://example2.com', likes: 2, creator: user2._id },
  ];

  const blogObjects = initialBlogs.map(blog => new Blog(blog));
  await Promise.all(blogObjects.map(blog => blog.save()));
});

test("1. the number of blogs is correct", async () => {
  const blogsAtStart = await Blog.find({}).populate('creator', { username: 1 });
  const response = await api.get("/api/blogs");

  assert.strictEqual(response.body.length, blogsAtStart.length);
});

test("2. verifies that the unique identifier is named id", async () => {
  const response = await api.get("/api/blogs");

  response.body.forEach((blog) => {
    assert(blog.id, "Expected blog to have an id property");
    assert.strictEqual(typeof blog.id, "string", "Expected id to be a string");
  });
});

test("3. a valid blog can be added", async () => {
  const initialBlogs = await api.get("/api/blogs");
  const initialBlogCount = initialBlogs.body.length;

  const newBlog = {
    title: "New Post",
    author: "Test Author",
    url: "http://testblog.com",
    likes: 5,
  };


  const users = await User.find({});
  const creatorUserId = users[0]._id;

  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  const response = await api
    .post("/api/blogs")
    .set('Authorization', `Bearer ${token}`) 
    .send({ ...newBlog, creator: creatorUserId }) 
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAfterPost = await api.get("/api/blogs");
  const blogsAfterPostCount = blogsAfterPost.body.length;

  assert.strictEqual(blogsAfterPostCount, initialBlogCount + 1);
  const titles = blogsAfterPost.body.map((blog) => blog.title);
  assert(titles.includes(newBlog.title));
});


test("should return 401 if no token is provided", async () => {
  const newBlog = {
    title: "Blog Without Token",
    author: "Test Author",
    url: "http://testblog.com",
    likes: 5,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(401)
    .expect("Content-Type", /application\/json/);
});


test("si falta la propiedad likes, tendrá el valor 0 por defecto", async () => {
  const nuevoBlogSinLikes = {
    title: "Blog sin likes",
    author: "Autor de Prueba",
    url: "http://blogsinlikes.com",
  };

  const users = await User.find({});
  const creatorUserId = users[0]._id;

  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  const response = await api
    .post("/api/blogs")
    .set('Authorization', `Bearer ${token}`)
    .send(nuevoBlogSinLikes)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  assert.strictEqual(response.body.likes, 0);
});


test("debe devolver 400 si faltan title o url en la solicitud", async () => {
  const blogSinTitulo = {
    author: "Autor de Prueba",
    url: "http://ejemplo.com",
  };

  const blogSinUrl = {
    title: "Blog sin URL",
    author: "Autor de Prueba",
  };

  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api.post("/api/blogs").set('Authorization', `Bearer ${token}`).send(blogSinTitulo).expect(400);
  await api.post("/api/blogs").set('Authorization', `Bearer ${token}`).send(blogSinUrl).expect(400);
});

test('delete a blog successfully', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToDelete = blogsAtStart[0]._id.toString();

  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api
    .delete(`/api/blogs/${blogToDelete}`)
    .set('Authorization', `Bearer ${token}`) 
    .expect(204);

  const blogsAtEnd = await Blog.find({});
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1);

  const ids = blogsAtEnd.map(blog => blog._id.toString());
  assert.strictEqual(ids.includes(blogToDelete), false);
});


test('deleting a non-existing blog returns 404', async () => {
  const nonExistingId = "66edf7c488ba05cd173f81f2";
  
  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api
    .delete(`/api/blogs/${nonExistingId}`)
    .set('Authorization', `Bearer ${token}`) 
    .expect(404);
});


test('returns 400 if id is invalid', async () => {
  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api
    .delete('/api/blogs/89328392893')
    .set('Authorization', `Bearer ${token}`) 
    .expect(400)
    .expect({ error: 'malformatted id' });
});


test('update a blog successfully', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToUpdate = blogsAtStart[0];

  const updatedData = {
    title: 'Updated Title',
    author: 'Updated Author',
    url: 'http://updatedurl.com',
  };

  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`) 
    .send(updatedData)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const updatedBlog = response.body;

  assert.strictEqual(updatedBlog.title, updatedData.title);
  assert.strictEqual(updatedBlog.author, updatedData.author);
  assert.strictEqual(updatedBlog.url, updatedData.url);
});

test('update fails with status 400 if title or author is missing', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToUpdate = blogsAtStart[0];

  const invalidData = {
    url: 'http://updatedurl.com',
  };

  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`) 
    .send(invalidData)
    .expect(400);
});

test('update fails with status 404 if blog does not exist', async () => {
  const nonExistingId = "66edff6480580f37dea7f972"; 

  const updatedData = {
    title: 'Updated Title',
    author: 'Updated Author',
    url: "updatepost.com"
  };

  const users = await User.find({});
  const creatorUserId = users[0]._id;
  const token = jwt.sign({ id: creatorUserId }, process.env.SECRET);

  await api
    .put(`/api/blogs/${nonExistingId}`)
    .set('Authorization', `Bearer ${token}`) 
    .send(updatedData)
    .expect(404) 
    .expect({ error: 'Blog not found' }); 
});


after(async () => {
  await mongoose.connection.close();
});