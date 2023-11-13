// project dependencies
import app, { Request, Response } from './app';

import Log from './logger';

const { SERVER_PORT } = process.env;

// app listening 
app.listen(SERVER_PORT, () => {
    Log.info(`App running on port ${SERVER_PORT}`);
});

app.get("/", (req: Request, res: Response) => {
    res.send("Healthy");
}); 