import express from "express";
import dotenv from "dotenv";
import connection from "./Config/dbConnections.js";
import router from "./Routes/userRoutes.js";
import cors from "cors";
import routerL from "./Routes/locationRoutes.js";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
dotenv.config();
connection();

app.use("/user", router);
app.use("/", routerL);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
