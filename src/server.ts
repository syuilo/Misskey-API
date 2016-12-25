/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

import * as express from 'express';
const vhost = require('vhost');

import config from './config';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');

/**
 * Register modules
 */
app.use(vhost(`api.${config.host}`, require('./api/server')));
app.use(vhost(config.secondary_host, require('./himasaku/server')));
app.use(vhost(`file.${config.secondary_host}`, require('./file/server')));
app.use(vhost(`proxy.${config.secondary_host}`, require('./web/service/proxy/server')));
app.use(require('./web/server'));

/**
 * Create server
 */
const server = config.https.enable ?
	https.createServer({
		key:  fs.readFileSync(config.https.key),
		cert: fs.readFileSync(config.https.cert),
		ca:   fs.readFileSync(config.https.ca)
	}, app) :
	http.createServer(app);

/**
 * Steaming
 */
require('./api/streaming')(server);

/**
 * Server listen
 */
server.listen(config.port, () => {
	process.send('ready');
});
