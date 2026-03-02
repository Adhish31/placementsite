const express = require('express');
const router = express.Router();
const { getPosts, createPost, toggleLike, addComment } = require('../controllers/forumController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', auth, getPosts);
router.post('/', auth, createPost);
router.put('/like/:id', auth, toggleLike);
router.post('/comment/:id', auth, addComment);

module.exports = router;
