'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../../models/user';
import Like from '../../../models/like';

/**
 * Aggregate like of a user
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const userId = params.user_id;
	if (userId === undefined || userId === null) {
		return rej('user_id is required');
	}

	// Lookup user
	const user = await User.findOne({
		_id: new mongo.ObjectID(userId)
	});

	if (user === null) {
		return rej('user not found');
	}

	const datas = await Like
		.aggregate([
			{ $match: { user_id: user._id } },
			{ $project: {
				created_at: { $add: ['$created_at', 9 * 60 * 60 * 1000] } // Convert into JST
			}},
			{ $project: {
				date: {
					year: { $year: '$created_at' },
					month: { $month: '$created_at' },
					day: { $dayOfMonth: '$created_at' }
				}
			}},
			{ $group: {
				_id: '$date',
				count: { $sum: 1 }
			}}
		])
		.toArray();

	datas.forEach(data => {
		data.date = data._id;
		delete data._id;
	});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		let day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter(d =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data)
		} else {
			graph.push({
				date: {
					year: day.getFullYear(),
					month: day.getMonth() + 1, // In JavaScript, month is zero-based.
					day: day.getDate()
				},
				count: 0
			})
		};
	}

	res(graph);
});
