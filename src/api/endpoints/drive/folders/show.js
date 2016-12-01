'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';

/**
 * Show a folder
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'folder_id' parameter
	const folderId = params.folder_id;
	if (folderId === undefined || folderId === null) {
		return rej('folder_id is required');
	}

	// Get folder
	const folder = await DriveFolder
		.findOne({
			_id: new mongo.ObjectID(folderId),
			user_id: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	// Serialize
	res(await serialize(folder, {
		includeParent: true
	}));
});
