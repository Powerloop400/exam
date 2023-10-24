const express = require('express')
const Blog = require('../models/blog')
const passport = require('passport');
const ExtractJWT = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser'); // Require cookie-parser


const blogRouter = express.Router()
const jwt = require('jsonwebtoken');



blogRouter.use(cookieParser());

const secretkey = process.env.JWT_SECRET;


const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

logger.info('This is an informational log.');
logger.error('This is an error log.');

module.exports = logger;


function calculateReadingTime(text, averageWPM) {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  let readingTimeSeconds = "";
  let readingTimeMinutes = "";
  let calcSeconds = 0;
  let calcMinutes = (wordCount / averageWPM);

  if (calcMinutes < 1) {
    calcSeconds = Math.floor(calcMinutes * 60);
    readingTimeSeconds = `${calcSeconds} seconds`;
    return readingTimeSeconds;
  } else {
    readingTimeMinutes = `${calcMinutes} minutes`;
    return readingTimeMinutes;
  }
}


function authenticate(req, res, next) {
  const token = req.cookies.token;  

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretkey, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.redirect('/error');
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    next();
  });
}



blogRouter.get('/blogs', (req, res) => {
    const page = req.query.page || 1; 
    const perPage = req.query.perPage || 20; 

    logger.info('GET /blogs route accessed.');

    Blog.paginate(
        { state: 'published' },
        {
            page: page,
            limit: perPage,
            sort: { timestamp: -1 },
        },
        (err, result) => {
            if (err) {
                logger.error('GET /blogs route error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            logger.info('GET /blogs route succeeded.');

            res.json(result);
        }
    );
});


blogRouter.get('/blogspage', (req, res) => {
  
    const page = req.query.page || 1; // Default to page 1
    const perPage = req.query.perPage || 20; // Default to 20 blogs per page

    logger.info('GET /blogspage route accessed.');

    Blog.paginate(
        { state: 'published' },
        {
            page: page,
            limit: perPage,
            sort: { timestamp: -1 },
        },
        (err, result) => {
            if (err) {
                logger.error('GET /blogspage route error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            logger.info('GET /blogspage route succeeded.');

            logger.info('Pagination: Page', page, 'PerPage', perPage);

            logger.info('Number of blogs returned:', result.docs.length);

            res.render('blogspage', { blogs: result.docs, user: req.user });
        }
    );
});

//blogapp

blogRouter.get('/myblogs', (req, res) => {
    const token = req.cookies.token;
    const user = jwt.verify(token, secretkey);

    const page = req.query.page || 1; // Default to page 1
    const perPage = req.query.perPage || 20; // Default to 20 blogs per page

        logger.info('GET /myblogs route accessed.');

    Blog.paginate(
        { state: 'published', author: user.userId },
        {
            page: page,
            limit: perPage,
            sort: { timestamp: -1 },
        },
        (err, result) => {
            if (err) {
                // Log the error message
                logger.error('GET /myblogs route error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            logger.info('GET /myblogs route succeeded.');

            logger.info('Pagination: Page', page, 'PerPage', perPage);

            logger.info('Number of blogs returned:', result.docs.length);

            res.render('myblogs', { blogs: result.docs, user: req.user });
        }
    );
});


blogRouter.get('/drafts', authenticate, (req, res) => {
    const page = req.query.page || 1; // Default to page 1
    const perPage = req.query.perPage || 20; // Default to 20 blogs per page

    // Log that the '/drafts' route has been accessed
    logger.info('GET /drafts route accessed.');

    Blog.paginate(
        { state: 'draft' },
        {
            page: page,
            limit: perPage,
            sort: { timestamp: -1 },
        },
        (err, result) => {
            if (err) {
                // Log the error message
                logger.error('GET /drafts route error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            logger.info('GET /drafts route succeeded.');

            logger.info('Pagination: Page', page, 'PerPage', perPage);

            logger.info('Number of draft blogs returned:', result.docs.length);

            res.render('drafts', { blogs: result.docs });
        }
    );
});


blogRouter.get('/blogs', async (req, res) => {
    const page = req.query.page || 1; 
    const perPage = req.query.perPage || 20; 
    const { author, title, tags } = req.query;

    const order = req.query.order || 'timestamp'; 

    const query = { state: 'published' };

    if (author) {
        query.author = author;
    }
    if (title) {
        query.title = { $regex: title, $options: 'i' }; // Case-insensitive search
    }
    if (tags) {
        query.tags = { $in: tags.split(',') };
    }

    const options = {
        page: page,
        limit: perPerPage,
        sort: getSortOption(order),
    };

    try {
        const result = await BlogModel.paginate(query, options);

        for (const blog of result.docs) {
            blog.read_count += 1;
            await blog.save();
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function getSortOption(order) {
    const validSortFields = ['read_count', 'reading_time', 'timestamp'];
    if (validSortFields.includes(order)) {
        const sortOption = {};
        sortOption[order] = -1; 
        return sortOption;
    } else {
        return { timestamp: -1 };
    }
}

  
  blogRouter.post('/blogs', authenticate, (req, res) => {
    const { title, description, tags, body } = req.body;
    const token = req.cookies.token;

    logger.info('POST /blogs route accessed.');

    if (!title || !description || !tags || !body) {
        logger.error('POST /blogs route error: Missing required fields');
        return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const author = jwt.verify(token, secretkey).userId;
    const read_count = 0;
    const averageWPM = 200;
    const reading_time = calculateReadingTime(body, averageWPM);

    Blog.findOne({ title })
        .then(existingBlog => {
            if (existingBlog) {
                logger.error('POST /blogs route error: Title must be unique');
                return res.status(400).json({ error: 'Title must be unique' });
            }

            const newBlog = new Blog({
                title,
                description,
                author,
                state: 'draft',
                read_count,
                reading_time,
                tags,
                body,
                timestamp: new Date(),
            });

            newBlog
                .save()
                .then(blog => {
                    logger.info('POST /blogs route succeeded: Blog created');
                    res.redirect("/drafts");
                })
                .catch(err => {
                    logger.error('POST /blogs route error:', err.message);
                    res.status(500).json({ error: err.message });
                });
        })
        .catch(err => {
            logger.error('POST /blogs route error:', err.message);
            res.status(500).json({ error: err.message });
        });
});

blogRouter.put('/:blogId/publish', async (req, res) => {
  const blogId = req.params.blogId;
  const token = req.cookies.token;
  const { userId } = jwt.verify(token, secretkey);
  try {
    console.log('blogId:', blogId);
    console.log('userId:', userId);

    // Check if the blog exists and the user is the owner
    const blog = await Blog.findOne({ _id: blogId, author: userId }).exec();
    console.log('blog:', blog);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or you are not the owner.' });
    }

    console.log('Retrieved blog:', blog);

    blog.state = 'published';
    await blog.save();

    res.redirect("/blogspage");
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update the state of the blog.' });
  }
});
    // Update a blog (owner only)
    
  blogRouter.put('/blogs/:blogId', async (req, res) => {
    const blogId = req.params.blogId;
    const token = req.cookies.token;
    const user = jwt.verify(token, secretkey);
  
    try {
      const blog = await Blog.findOne({ _id: blogId, author: user.userId }).exec();
    
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found or you are not the owner.' });
      }
  
      const { title, description, body, tags } = req.body;
      blog.title = title;
      blog.description = description;
      blog.body = body;
      blog.tags = tags;
  
      blog.state = 'draft';

        await blog.save();

        res.redirect('/drafts');
    } catch (error) {
      res.status(500).json({ error: 'Failed to edit the blog.' });
      console.log(error);
    }
  });
  
blogRouter.delete('/blogs/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const token = req.cookies.token;
  const user = jwt.verify(token, secretkey);

  try {
    const blog = await Blog.findOne({ _id: blogId, author: user.userId }).exec();

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or you are not the owner.' });
    }

    await blog.remove();

    res.redirect("/myblogs");
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete the blog.' });
  }
});

module.exports = blogRouter;
