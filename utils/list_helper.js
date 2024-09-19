const dummy = (listWithOneBlog) => {
  return 1;
};

const totalLikes = (blogs) => {
  const likes = blogs.reduce((sum, blog) => {
    return sum + blog.likes;
  }, 0);

  return likes;
};
const favoriteBlog = (blogs) => {
  const mostLikedBlog = blogs.reduce((max, blog) => {
    return blog.likes > max.likes ? blog : max;
  }, blogs[0]);

  return {
    title: mostLikedBlog.title,
    author: mostLikedBlog.author,
    likes: mostLikedBlog.likes,
  };
};
const lodash = require("lodash");

const mostBlogs = (blogs) => {
  const authorBlogCounts = lodash.countBy(blogs, "author");

  const mostBlogsAuthor = lodash.maxBy(
    lodash.keys(authorBlogCounts),
    (author) => authorBlogCounts[author]
  );

  return {
    author: mostBlogsAuthor,
    blogs: authorBlogCounts[mostBlogsAuthor],
  };
};
const mostLikes = (blogs) => {
  const likesByAuthor = lodash.reduce(
    blogs,
    (acc, blog) => {
      acc[blog.author] = (acc[blog.author] || 0) + blog.likes;
      return acc;
    },
    {}
  );

  const mostLikesAuthor = lodash.maxBy(
    lodash.keys(likesByAuthor),
    (author) => likesByAuthor[author]
  );

  return {
    author: mostLikesAuthor,
    likes: likesByAuthor[mostLikesAuthor],
  };
};

module.exports = {
  totalLikes,
  dummy,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
