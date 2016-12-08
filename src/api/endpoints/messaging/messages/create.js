'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Message from '../../../models/messaging-message';
import History from '../../../models/messaging-history';
import User from '../../../models/user';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/messaging-message';
import publishUserStream from '../../../event';
import { publishMessagingStream } from '../../../event';
import config from '../../../../config';

/**
 * 最大文字数
 */
const maxTextLength = 500;

/**
 * Create a message
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	let recipient = params.user_id;
	if (recipient !== undefined && recipient !== null) {
		recipient = await User.findOne({
			_id: new mongo.ObjectID(recipient)
		});

		if (recipient === null) {
			return rej('user not found');
		}
	} else {
		return rej('user_id is required');
	}

	// Get 'text' parameter
	let text = params.text;
	if (text !== undefined && text !== null) {
		text = text.trim();
		if (text.length === 0) {
			text = null;
		} else if (text.length > maxTextLength) {
			return rej('too long text');
		}
	} else {
		text = null;
	}

	// Get 'file_id' parameter
	let file = params.file_id;
	if (file !== undefined && file !== null) {
		file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file),
			user_id: user._id
		}, {
			data: false
		});

		if (file === null) {
			return rej('file not found');
		}
	} else {
		file = null;
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (text === null && file === null) {
		return rej('text or file is required');
	}

	// メッセージを作成
	const inserted = await Message.insert({
		created_at: new Date(),
		file_id: file ? file._id : undefined,
		recipient_id: recipient._id,
		text: text ? text : undefined,
		user_id: user._id,
		is_read: false
	});

	const message = inserted.ops[0];

	// Serialize
	const messageObj = await serialize(message);

	// Reponse
	res(messageObj);

	// 自分のストリーム
	publishMessagingStream(message.user_id, message.recipient_id, 'message', messageObj);
	publishUserStream(message.user_id, 'messaging_message', messageObj);

	// 相手のストリーム
	publishMessagingStream(message.recipient_id, message.user_id, 'message', messageObj);
	publishUserStream(message.recipient_id, 'messaging_message', messageObj);

	// 5秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await Message.findOne({ _id: message._id }, { is_read: true });
		if (!freshMessage.is_read) {
			publishUserStream(message.recipient_id, 'unread_messaging_message', messageObj);
		}
	}, 5000);

	// Register to search database
	if (message.text && config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'messaging_message',
			id: message._id.toString(),
			body: {
				text: message.text
			}
		});
	}

	// 履歴作成(自分)
	History.updateOne({
		user_id: user._id,
		partner: recipient._id
	}, {
		updated_at: new Date(),
		user_id: user._id,
		partner: recipient._id,
		message: message._id
	}, {
		upsert: true
	});

	// 履歴作成(相手)
	History.updateOne({
		user_id: recipient._id,
		partner: user._id
	}, {
		updated_at: new Date(),
		user_id: recipient._id,
		partner: user._id,
		message: message._id
	}, {
		upsert: true
	});
});
