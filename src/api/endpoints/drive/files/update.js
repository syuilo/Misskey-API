'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../../../models/drive-folder';
import DriveFile from '../../../models/drive-file';
import { validateFileName } from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';
import event from '../../../event';

/**
 * Update a file
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'file_id' parameter
	const fileId = params.file_id;
	if (fileId === undefined || fileId === null) {
		return rej('file_id is required');
	}

	const file = await DriveFile
		.findOne({
			_id: new mongo.ObjectID(fileId),
			user_id: user._id
		}, {
			data: false
		});

	if (file === null) {
		return rej('file-not-found');
	}

	// Get 'name' parameter
	let name = params.name;
	if (name) {
		name = name.trim();
		if (validateFileName(name)) {
			file.name = name;
		} else {
			return rej('invalid file name');
		}
	}

	// Get 'folder_id' parameter
	let folderId = params.folder_id;
	if (folderId !== undefined && folderId !== 'null') {
		folderId = new mongo.ObjectID(folderId);
	}

	let folder = null;
	if (folderId !== undefined && folderId !== null) {
		if (folderId === 'null') {
			file.folder_id = null;
		} else {
			folder = await DriveFolder
				.findOne({
					_id: folderId,
					user_id: user._id
				});

			if (folder === null) {
				return reject('folder-not-found');
			}

			file.folder_id = folder._id;
		}
	}

	DriveFile.updateOne({ _id: file._id }, {
		$set: file
	});

	// Serialize
	const fileObj = await serialize(file);

	// Response
	res(fileObj);

	// Publish drive_file_updated event
	event(user._id, 'drive_file_updated', fileObj);
});
