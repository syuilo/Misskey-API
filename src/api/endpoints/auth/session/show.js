'use strict';

/**
 * Module dependencies
 */
import * as uuid from 'uuid';
import App from '../../../models/app';
import AuthSess from '../../../models/auth-session';
import serialize from '../../../serializers/auth-session';

/**
 * Show a session
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	// Get 'token' parameter
	const token = params.token;
	if (token == null) {
		return rej('token is required');
	}

	// Lookup session
	const session = await AuthSess.findOne({
		token: token
	});

	if (session == null) {
		return rej('session not found');
	}

	// Response
	res(await serialize(session));
});