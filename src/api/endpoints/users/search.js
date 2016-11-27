'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import serialize from '../../serializers/user';
import es from '../../db/elasticsearch';

const size = 10;

/**
 * Search a user
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'query' parameter
	let query = params.query;
	if (query === undefined || query === null || query.trim() === '') {
		return rej('query is required');
	}

	// Get 'page' parameter
	let page = params.page;
	if (page === undefined) {
		page = 1;
	} else if (page === 0) {
		page = 1;
	}

	const from = (page - 1) * size;

	es.search({
		index: 'misskey',
		type: 'user',
		body: {
			size: size,
			from: from,
			query: {
				simple_query_string: {
					fields: ['username', 'name', 'bio'],
					query: query,
					default_operator: 'and'
				}
			}
		}
	}, async (error, response) => {
		if (error) {
			console.error(error);
			return res(500);
		}

		if (response.hits.total === 0) {
			return res([]);
		}

		const hits = response.hits.hits.map(hit => new mongo.ObjectID(hit._id));

		const users = await User
			.find({
				_id: {
					$in: hits
				}
			})
			.toArray();

		// Serialize
		res(await Promise.all(users.map(async user =>
			await serialize(user, me, { detail: true }))));
	});
});
