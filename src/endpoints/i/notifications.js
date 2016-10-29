'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Notification from '../../models/notification';
import serialize from '../../serializers/notification';

/**
 * Get notifications
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Init 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// 1 ~ 100 まで
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since || null;
	const max = params.max || null;

	// 両方指定してたらエラー
	if (since !== null && max !== null) {
		return rej('cannot set since and max');
	}

	const query = {
		i: user._id
	};

	const sort = {
		created_at: -1
	};

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

	// クエリ発行
	const notifications = await Notification
		.find(query, {}, {
			limit: limit,
			sort: sort
		})
		.toArray();

	if (notifications.length === 0) {
		return res([]);
	}

	// serialize
	res(await Promise.all(notifications.map(async notification =>
		await serialize(notification))));
});
