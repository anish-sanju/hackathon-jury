import * as path from "path";
import express from "express";
import bodyParser from "body-parser";
import layout from "express-ejs-layouts";
import pageRouter from "./routes/index";
import teamRouter from "./routes/team";

const app = express()
  .set("views", "./views")
  .set("view engine", "ejs")
  .use(bodyParser.urlencoded({ extended: true }))
  .use(express.static(path.join(__dirname, "public")))
  .use(layout);


app.use('/', pageRouter);
app.use('/teams', teamRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
