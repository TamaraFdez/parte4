const { test, after, before } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");

const api = supertest(app);
const expect = (value) => ({
  toBe: (expected) => {
    assert.strictEqual(value, expected);
  },
});

before(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});

  const user1 = new User({ username: 'user1', passwordHash: 'hashedpassword1' });
  const user2 = new User({ username: 'user2', passwordHash: 'hashedpassword2' });

  await user1.save();
  await user2.save();

  // Guardar blogs de prueba con la propiedad `creator`
  const initialBlogs = [
    { title: 'Test Blog 1', author: 'Author 1', url: 'http://example1.com', likes: 1, creator: user1._id },
    { title: 'Test Blog 2', author: 'Author 2', url: 'http://example2.com', likes: 2, creator: user2._id },
  ];

  const blogObjects = initialBlogs.map(blog => new Blog(blog));
  const savedBlogs = await Promise.all(blogObjects.map(blog => blog.save()));

  console.log('Saved Blogs:', savedBlogs); // Para depuración
});

test("1.the number of blogs is correct", async () => {
  const blogsAtStart = await Blog.find({}).populate('creator', { username: 1 }); // Usa populate si necesitas información del creador

  const response = await api.get("/api/blogs");
  
  console.log('Response Body:', response.body); // Añade esta línea para depuración
  
  // Asegúrate de que response.body no sea undefined
  assert(response.body, "Expected response.body to be defined");

  assert.strictEqual(response.body.length, blogsAtStart.length); // Asegúrate de que la longitud sea correcta
});


test("2.verifies that the unique identifier is named id", async () => {
  const response = await api.get("/api/blogs");

  response.body.forEach((blog) => {
    assert(blog.id, "Expected blog to have an id property");
    assert.strictEqual(typeof blog.id, "string", "Expected id to be a string");
  });
});

// Test para asegurarte de que la información del creador se guarda
test("3.a valid blog can be added", async () => {
  const initialBlogs = await api.get("/api/blogs");
  const initialBlogCount = initialBlogs.body.length;

  const newBlog = {
    title: "New Post",
    author: "Test Author",
    url: "http://testblog.com",
    likes: 5,
  };

  // Obtener el primer usuario para asignar como creador
  const users = await User.find({});
  const creatorUserId = users[0]._id;

  const response = await api
    .post("/api/blogs")
    .send({ ...newBlog, creator: creatorUserId }) 
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAfterPost = await api.get("/api/blogs");
  const blogsAfterPostCount = blogsAfterPost.body.length;

  assert.strictEqual(blogsAfterPostCount, initialBlogCount + 1);

  const titles = blogsAfterPost.body.map((blog) => blog.title);
  assert(titles.includes(newBlog.title));
});

test("si falta la propiedad likes, tendrá el valor 0 por defecto", async () => {
  const nuevoBlogSinLikes = {
    title: "Blog sin likes",
    author: "Autor de Prueba",
    url: "http://blogsinlikes.com",
  };

  const response = await api
    .post("/api/blogs")
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

  await api.post("/api/blogs").send(blogSinTitulo).expect(400);
  await api.post("/api/blogs").send(blogSinUrl).expect(400);
});

// Test de eliminación de blogs
test('delete a blog successfully', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToDelete = blogsAtStart[0]._id.toString();

  await api
    .delete(`/api/blogs/${blogToDelete}`)
    .expect(204);

  const blogsAtEnd = await Blog.find({});
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1);

  const ids = blogsAtEnd.map(blog => blog._id.toString());
  assert.strictEqual(ids.includes(blogToDelete), false);
});

test('deleting a non-existing blog returns 404', async () => {
  const nonExistingId = "66edf7c488ba05cd173f81f2";

  await api
    .delete(`/api/blogs/${nonExistingId}`)
    .expect(404);
});

test('returns 400 if id is invalid', async () => {
  await api
    .delete('/api/blogs/89328392893')
    .expect(400)
    .expect({ error: 'malformatted id' });
});

// Test de actualización de blogs
test('update a blog successfully', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToUpdate = blogsAtStart[0];

  const updatedData = {
    title: 'Updated Title',
    author: 'Updated Author',
    url: 'http://updatedurl.com',
  };

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedData)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const updatedBlog = response.body;

  expect(updatedBlog.title).toBe(updatedData.title);
  expect(updatedBlog.author).toBe(updatedData.author);
  expect(updatedBlog.url).toBe(updatedData.url);
});

test('update fails with status 400 if title or author is missing', async () => {
  const blogsAtStart = await Blog.find({});
  const blogToUpdate = blogsAtStart[0];

  const invalidData = {
    url: 'http://updatedurl.com',
  };

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(invalidData)
    .expect(400);
});

test('update fails with status 404 if blog does not exist', async () => {
  const nonExistingId = "66edff6480580f37dea7f972";

  const updatedData = {
    title: 'Updated Title',
    author: 'Updated Author',
  };

  await api
    .put(`/api/blogs/${nonExistingId}`)
    .send(updatedData)
    .expect(404);
});

after(async () => {
  await mongoose.connection.close();
});
