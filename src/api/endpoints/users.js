'use strict';

/**
 * Module dependencies
 */
import User from '../models/user';
import serialize from '../serializers/user';

/**
 * Lists all users
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	// Construct query
	const sort = {
		created_at: -1
	};
	const query = {};
	if (since !== null) {
		sort.created_at = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	// Issue query
	const users = await User
		.find(query, {}, {
			limit: limit,
			sort: sort
		})
		.toArray();

	// Serialize
	res(await Promise.all(users.map(async user =>
		await serialize(user, me))));
});
