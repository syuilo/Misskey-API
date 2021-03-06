'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import serialize from '../../serializers/user';
import event from '../../event';
import config from '../../../config';

/**
 * Update myself
 *
 * @param {Object} params
 * @param {Object} user
 * @param {Object} _
 * @param {boolean} isSecure
 * @return {Promise<object>}
 */
module.exports = async (params, user, _, isSecure) =>
	new Promise(async (res, rej) =>
{
	// Get 'name' parameter
	const name = params.name;
	if (name !== undefined && name !== null) {
		if (name.length > 50) {
			return rej('too long name');
		}

		user.name = name;
	}

	// Get 'location' parameter
	const location = params.location;
	if (location !== undefined && location !== null) {
		if (location.length > 50) {
			return rej('too long location');
		}

		user.location = location;
	}

	// Get 'bio' parameter
	const bio = params.bio;
	if (bio !== undefined && bio !== null) {
		if (bio.length > 500) {
			return rej('too long bio');
		}

		user.bio = bio;
	}

	// Get 'avatar_id' parameter
	const avatar = params.avatar_id;
	if (avatar !== undefined && avatar !== null) {
		user.avatar_id = new mongo.ObjectID(avatar);
	}

	// Get 'banner_id' parameter
	const banner = params.banner_id;
	if (banner !== undefined && banner !== null) {
		user.banner_id = new mongo.ObjectID(banner);
	}

	await User.updateOne({ _id: user._id }, {
		$set: user
	});

	// Serialize
	const iObj = await serialize(user, user, {
		detail: true,
		includeSecrets: isSecure
	})

	// Send response
	res(iObj);

	// Publish i updated event
	event(user._id, 'i_updated', iObj);

	// Update search index
	if (config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'user',
			id: user._id.toString(),
			body: {
				name: user.name,
				bio: user.bio
			}
		});
	}
});
