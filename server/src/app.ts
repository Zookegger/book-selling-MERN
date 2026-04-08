import express, { Application } from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import { initializeAuth } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(initializeAuth());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
