'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Like from '../../../models/like';
import Post from '../../../models/post';
import User from '../../../models/user';
//import event from '../../../event';

/**
 * Unlike a post
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

	// Check arleady liked
	const exist = await Like.findOne({
		post: post._id,
		user: user._id,
		deleted_at: { $exists: false }
	});

	if (exist === null) {
		return rej('already not liked');
	}

	// Delete like
	await Like.updateOne({
		_id: exist._id
	}, {
		$set: {
			deleted_at: new Date()
		}
	});

	// Send response
	res();

	// Decrement likes count
	Post.updateOne({ _id: post._id }, {
		$inc: {
			likes_count: -1
		}
	});

	// Decrement user likes count
	User.updateOne({ _id: user._id }, {
		$inc: {
			likes_count: -1
		}
	});

	// Decrement user liked count
	User.updateOne({ _id: post.user }, {
		$inc: {
			liked_count: -1
		}
	});
});
