import path from "path";
import express from "express";
import * as dotenv from "dotenv";

import indexRoute from "./routes";
import shortRoute from "./routes/short";
import infoRoute from "./routes/info";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../static")));

app.use(indexRoute);
app.use(shortRoute);
app.use(infoRoute);

export default app.listen(process.env.PORT, () => {
    console.log(`[Server] listening to port ${process.env.PORT}.`);
});