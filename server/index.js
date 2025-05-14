import express from "express";
import dotenv from "dotenv";
import connection from "./Config/dbConnections.js";
import router from "./Routes/userRoutes.js";
import cors from "cors";
import routerL from "./Routes/locationRoutes.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://eco-recycle-rho.vercel.app",
  "https://book-store-web-flame.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
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
