'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Favorite from '../../models/favorite';
import Post from '../../models/post';

/**
 * Favorite a post
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'post_id' parameter
	let postId = params.post_id;
	if (postId === undefined || postId === null) {
		return rej('post_id is required');
	}

	// Get favoritee
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found');
	}

	// Check arleady favorited
	const exist = await Favorite.findOne({
		post_id: post._id,
		user_id: user._id
	});

	if (exist !== null) {
		return rej('already favorited');
	}

	// Create favorite
	const inserted = await Favorite.insert({
		created_at: new Date(),
		post_id: post._id,
		user_id: user._id
	});

	const favorite = inserted.ops[0];

	// Send response
	res();
});
