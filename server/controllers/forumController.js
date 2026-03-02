const Post = require('../models/Post');

// Get all posts
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Create a post
exports.createPost = async (req, res) => {
    try {
        const newPost = new Post({
            user: req.user.id,
            title: req.body.title,
            content: req.body.content,
            tags: req.body.tags
        });
        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Like/Unlike a post
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const index = post.likes.indexOf(req.user.id);

        if (index > -1) {
            post.likes.splice(index, 1);
        } else {
            post.likes.push(req.user.id);
        }

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Comment on a post
exports.addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({
            user: req.user.id,
            text: req.body.text
        });
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
