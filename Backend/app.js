import express from "express";
import pg from "pg";

import body from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "EasyFin",
  password: "232004",
  port: 5432,
});

db.connect();
app.use(express.json());
app.use(body.urlencoded({extended:true}));

const authMiddleware = (req, res, next) => {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized: missing user id",
    });
  }

  req.user = { id: userId };
  next();
};

app.get("/", (req, res) => {
  res.send("Server is running");
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
