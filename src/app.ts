// global dependencies
import * as dotenv from 'dotenv';

dotenv.config();  // initialise environment variables using a local .env file

import cors from 'cors';

import bodyParser from "body-parser"

import { router } from './routes';

// set express app
import express,{ Application, Request as ExpRequest, Response as ExpResponse} from 'express';

interface Request extends ExpRequest {
    user?: any; 
}

interface Response extends ExpResponse {
    user?: any; 
}

const app: Application = express();

// middlewares
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: true }))

app.use('/', router)

export { Request, Response };

export default app;