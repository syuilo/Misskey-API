'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
const deepcopy = require('deepcopy');
import User from '../models/user';
import Following from '../models/following';
import getFriends from '../common/get-friends';
import config from '../../config';

/**
 * Serialize a user
 *
 * @param {Object} user
 * @param {Object} me?
 * @param {Object} options?
 * @return {Promise<Object>}
 */
export default (
	user: any,
	me?: any,
	options?: {
		detail: boolean,
		includeSecrets: boolean
	}
) => new Promise<any>(async (resolve, reject) => {

	const opts = Object.assign({
		detail: false,
		includeSecrets: false
	}, options);

	let _user: any;

	// Populate the user if 'user' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(user)) {
		_user = await User.findOne({
			_id: user
		});
	} else if (typeof user === 'string') {
		_user = await User.findOne({
			_id: new mongo.ObjectID(user)
		});
	} else {
		_user = deepcopy(user);
	}

	// Me
	if (me && !mongo.ObjectID.prototype.isPrototypeOf(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me._id;
		}
	}

	// Rename _id to id
	_user.id = _user._id;
	delete _user._id;

	// Remove private properties
	delete _user.password;
	delete _user.token;
	delete _user.username_lower;

	// Visible via only the official client
	if (!opts.includeSecrets) {
		delete _user.data;
		delete _user.email;
	}

	_user.avatar_url = _user.avatar_id != null
		? `${config.drive_url}/${_user.avatar_id}`
		: `${config.drive_url}/default-avatar.jpg`;

	_user.banner_url = _user.banner_id != null
		? `${config.drive_url}/${_user.banner_id}`
		: null;

	if (!me || me.toString() !== _user.id.toString() || !opts.detail) {
		delete _user.avatar_id;
		delete _user.banner_id;

		delete _user.drive_capacity;
	}

	if (me && me.toString() !== _user.id.toString()) {
		// If the user is following
		const follow = await Following.findOne({
			follower_id: me,
			followee_id: _user.id,
			deleted_at: { $exists: false }
		});
		_user.is_following = follow !== null;

		// If the user is followed
		const follow2 = await Following.findOne({
			follower_id: _user.id,
			followee_id: me,
			deleted_at: { $exists: false }
		});
		_user.is_followed = follow2 !== null;
	}

	if (me && me.toString() !== _user.id.toString() && opts.detail) {
		const myFollowingIds = await getFriends(me);

		// Get following you know count
		const followingYouKnowCount = await Following.count({
			followee_id: { $in: myFollowingIds },
			follower_id: _user.id,
			deleted_at: { $exists: false }
		});
		_user.following_you_know_count = followingYouKnowCount;

		// Get followers you know count
		const followersYouKnowCount = await Following.count({
			followee_id: _user.id,
			follower_id: { $in: myFollowingIds },
			deleted_at: { $exists: false }
		});
		_user.followers_you_know_count = followersYouKnowCount;
	}

	resolve(_user);
});
/*
function img(url) {
	return {
		thumbnail: {
			large: `${url}`,
			medium: '',
			small: ''
		}
	};
}
*/
