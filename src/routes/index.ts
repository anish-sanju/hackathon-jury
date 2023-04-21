import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.render("themes");
});

router.get("/addteam", (req, res) => {
  res.render("addTeam", { data: {} });
});


export default router;