import * as mongodb from 'mongodb';

const collection = ((global as any).db as mongodb.Db).collection('users');

collection.createIndex('username');
collection.createIndex('token');

export default collection;

export function validateUsername(username: string): boolean {
	return /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}
