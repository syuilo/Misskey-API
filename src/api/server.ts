/**
 * API Server
 */

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as multer from 'multer';

import endpoints from './endpoints';

/**
 * Init app
 */
const app = express();

app.disable('x-powered-by');
app.set('etag', false);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
	origin: true
}));

/**
 * Register endpoint handlers
 */
endpoints.forEach(endpoint =>
	endpoint.withFile ?
		app.post('/' + endpoint.name,
			endpoint.withFile ? multer({ dest: 'uploads/' }).single('file') : null,
			require('./api-handler').default.bind(null, endpoint)) :
		app.post('/' + endpoint.name,
			require('./api-handler').default.bind(null, endpoint))
);

app.post('/signup', require('./private/signup').default);
app.post('/signin', require('./private/signin').default);

module.exports = app;
