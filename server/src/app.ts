import express, { Application } from "express";
import cors from "cors";
import routes from "./routes";
import { initializeAuth } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(initializeAuth());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
