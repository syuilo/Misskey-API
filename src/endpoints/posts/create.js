'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import User from '../../models/user';
import DriveFile from '../../models/drive-file';
import serialize from '../../serializers/post';
//import savePostMentions from '../../core/save-post-mentions';
//import extractHashtags from '../../core/extract-hashtags';
//import registerHashtags from '../../core/register-hashtags';
import createFile from '../../common/add-file-to-drive';
import event from '../../event';
import es from '../../db/elasticsearch';

/**
 * 最大文字数
 */
const maxTextLength = 300;

/**
 * 添付できるファイルの数
 */
const maxFileLength = 4;

/**
 * Create a post
 *
 * @param {Object} params
 * @param {Object} reply
 * @param {Object} user
 * @param {Object} app
 * @return {void}
 */
module.exports = async (params, reply, user, app) =>
{
	// Init 'repost' parameter
	const repost = params.repost;
	if (repost !== undefined && repost !== null) {
		// Get repostee
		const repostee = await Post.findOne({
			_id: new mongo.ObjectID(repost)
		});

		if (repostee === null) {
			return reply(404, 'repostee is not found');
		} else if (repostee.hasOwnProperty('repost')) {
			return reply(400, 'cannot repost from repost');
		}

		// Repostを作成
		const res = await Post.insert({
			created_at: Date.now(),
			repost: repostee._id,
			user: user._id
		});

		const post = res.ops[0];

		// Update repostee status
		Post.updateOne({ _id: repostee._id }, {
			$set: {
				repost_count: repostee.repost_count + 1 || 1
			}
		});

		return created(post);
	}

	// Init 'text' parameter
	let text = params.text;
	if (text !== undefined && text !== null) {
		text = text.trim();
		if (text.length === 0) {
			text = null;
		} else if (text[0] === '$') {
			return command(text);
		} else if (text.length > maxTextLength) {
			return reply(400, 'too long text');
		}
	} else {
		text = null;
	}

	// Init 'reply_to' parameter
	let replyTo = params.reply_to;
	let replyToEntity = null;
	if (replyTo !== undefined && replyTo !== null) {
		replyToEntity = await Post.findOne({
			_id: new mongo.ObjectID(replyTo)
		});

		if (replyToEntity === null) {
			return reply(404, 'reply to post is not found');
		} else if (replyToEntity.hasOwnProperty('repost')) {
			return reply(400, 'cannot reply to repost');
		}
	} else {
		replyTo = null;
	}

	// Init 'images' parameter
	let images = params.images;
	let files = [];
	if (images !== undefined && images !== null) {
		images = images.split(',');

		if (images.length === 0) {
			images = null;
		} else if (images.length > maxFileLength) {
			return reply(400, 'too many images');
		}

		if (images !== null) {
			// 重複チェック
			images = images.filter((x, i, self) => self.indexOf(x) === i);
		}

		// Check file entities
		for (let i = 0; i < images.length; i++) {
			const image = images[i];

			const entity = await DriveFile.findOne({
				_id: new mongo.ObjectID(image),
				user: user._id
			}, {
				data: false
			});

			if (entity === null) {
				return reply(400, 'file not found');
			} else {
				files.push(entity);
			}
		}
	} else {
		files = null;
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (text === null && files === null) {
		return reply(400, 'text or files is required');
	}

	// 投稿を作成
	const res = await Post.insert({
		created_at: Date.now(),
		images: images ? files.map(file => file._id) : undefined,
		reply_to: replyToEntity !== null ? replyToEntity._id : undefined,
		text: text,
		user: user._id
	});

	const post = res.ops[0];

	// Update replyee status
	if (replyToEntity !== null) {
		Post.updateOne({ _id: replyToEntity._id }, {
			$set: {
				replies_count: replyToEntity.replies_count + 1 || 1
			}
		});
	}

	created(post);

	async function created(post) {
		user.posts_count++;
		post.user = user;

		const postObj = await serialize(post);

		reply(postObj);

		// Publish to stream
		event.publishPost(user._id, postObj);

		// ハッシュタグ抽出
		//const hashtags = extractHashtags(text);

		// ハッシュタグをデータベースに登録
		//registerHashtags(user, hashtags);

		// メンションを抽出してデータベースに登録
		//savePostMentions(user, post, post.text);

		// ユーザー情報更新
		User.updateOne({ _id: user._id }, {
			$set: user
		});

		// Register to search database
		if (post.text != null) {
			es.index({
				index: 'misskey',
				type: 'post',
				id: post._id.toString(),
				body: {
					text: post.text
				}
			});
		}
	}

	async function command(text) {
		const separator = ' ';
		const cmd = text.substr(1, text.indexOf(separator) - 1);
		const arg = text.substr(text.indexOf(separator) + 1);

		switch (cmd) {
			case 'write':
				// Create file
				await createFile(user, new Buffer(arg), Date.now() + '.txt', null, null);
				reply();
				break;
			default:
				reply(400, 'unknown command');
				break;
		}
	}
};
