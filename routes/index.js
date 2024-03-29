var express = require('express');
var router = express.Router();
var passport = require('passport');
var github = require('octonode');
var bp = require('body-parser');
var urlencodedParser = bp.urlencoded({ extended: false });
var Post = require("../models/post.js");
var User = require("../models/user.js");


router.get('/login',function(req,res) {
	req.session.save();
	res.render('login');
});

router.get('/newIdea', isLoggedIn, function(req, res, next) {
  var sessId = req.sessionID;
  req.session.reload( function (err) {
		var session = JSON.parse(req.sessionStore.sessions[sessId]);
		console.log(session.passport);
		req.session.save();
  	res.render('newIdea');    
  });
});

router.post('/', isLoggedIn, urlencodedParser, function(req,res) { 
	console.log(req.sessionID);
  req.session.reload( function (err) {
		var user = JSON.parse(req.sessionStore.sessions[req.sessionID]).passport.user;
		console.log(user);
		var newPost = new Post({title: req.body.title,
														description: req.body.description,
														Author: user._id,
														upvotes: 0});
		newPost.save(function(err, post){
			if (err)
				console.log(err)
			else {
				User.findByIdAndUpdate(post.Author, {$push: {"posts": post._id}}, function(err, model) {
					if(err)
						console.log(err);
				});
			}
		});
		var client = github.client(user.token);
		var ghrepo      = client.repo('Gouthamve/reaction-test');
		ghrepo.issue({
		  "title": req.body.title,
		  "body": req.body.description
		}, function(err, resp) {
			if(err) {
				console.log(err);
				res.redirect('/newIdea');
			}
			else
				res.redirect('/');
		}); //issue
  });
});

router.get('/auth/github', passport.authenticate('github', {scope: ['user:email', 'repo']}));

router.get('/auth/github/callback', 
	passport.authenticate('github', {
    failureRedirect : '/login',
    successRedirect: '/newIdea'
  }));

/* GET home page. */
router.get('/',function(req,res) {
	Post.find(function(err, posts){
		if(err) {
			console.log(err);
			res.redirect('/fail');
		} else {
			var i = 0;
			var Authors = [];
			for(i = 0; i < posts.length; i++) {	
				changePost(posts, i);
			}
			User.findById(posts[0])
  		res.render('index', {posts: posts});
  	}
	});
 });



router.get('/upvote/:id', function(req,res) { 
	console.log(req.params.id);
	Post.findById(req.params.id, function(err, post) {
		if(err)
			console.log(err)
		else
			post.update({$inc: {upvotes: 1}}, function(err){
				if (err)
					console.log(err)
			});
	})
	res.redirect('/');
});


function changePost(posts, i) {
	User.findById(posts[i].Author, function(err, Author){
		posts[i].Author = Author.name;
	});
};

function isLoggedIn(req, res, next) {
	req.session.reload( function (err) {
		// if user is authenticated in the session, carry on
	  var sessId = req.sessionID;
	  var sessions = req.sessionStore.sessions; 
	  if (JSON.parse(sessions[sessId]).passport.user)
	    return next();
	  // if they aren't redirect them to the home page
  	res.redirect('/login');
  });  
};

module.exports = router;

