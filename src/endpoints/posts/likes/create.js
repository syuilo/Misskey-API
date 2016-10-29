'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Like from '../../../models/like';
import Post from '../../../models/post';
import User from '../../../models/user';
import notify from '../../../common/notify';
import event from '../../../event';
import serializeUser from '../../../serializers/user';
import serializePost from '../../../serializers/post';

/**
 * Like a post
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Init 'post' parameter
	let postId = params.post;
	if (postId === undefined || postId === null) {
		return rej('post is required');
	}

	// Get likee
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found');
	}

	// Myself
	if (post.user.toString() === user._id.toString()) {
		return rej('-need-translate-');
	}

	// Check arleady liked
	const exist = await Like.findOne({
		post: post._id,
		user: user._id,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return rej('already liked');
	}

	// Create like
	const inserted = await Like.insert({
		created_at: new Date(),
		post: post._id,
		user: user._id
	});

	const like = inserted.ops[0];

	// Send response
	res();

	// Increment likes count
	Post.updateOne({ _id: post._id }, {
		$inc: {
			likes_count: 1
		}
	});

	// Increment user likes count
	User.updateOne({ _id: user._id }, {
		$inc: {
			likes_count: 1
		}
	});

	// Increment user liked count
	User.updateOne({ _id: post.user }, {
		$inc: {
			liked_count: 1
		}
	});

	// Notify
	notify(post.user, 'like', {
		user: user._id,
		post: post._id
	});

	// Publish like event
	event(post.user, 'like', {
		user: await serializeUser(user, post.user),
		post: await serializePost(post, post.user)
	});
});
