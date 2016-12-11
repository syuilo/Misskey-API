import * as path from 'path';
import * as express from 'express';
import * as ms from 'ms';

export default (name: string) => (req: express.Request, res: express.Response) => {
	res.sendFile(path.resolve(`${__dirname}/client/${name}/view.html`), {
		maxAge: ms('7 days')
	});
};
