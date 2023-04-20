import express from "express";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import * as path from "path";
import layout from "express-ejs-layouts";
import http from "node:http";

const prisma = new PrismaClient();
const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(layout);

const teamidPrefixMap = new Map<string, string>([
  ["Healthcare", "H"],
  ["Finance", "F"],
  ["Social Innovation", "S"],
  ["Energy and Sustainability", "E"],
]);

app.get("/", (req, res) => {
  res.render("themes");
});

app.get("/addteam", (req, res) => {
  res.render("addTeam", { data: {} });
});

// Define a route to handle form submissions
app.post("/team", async (req, res) => {
  const { name, member1, member2, member3, theme } = req.body;
  const teamidPrefix = teamidPrefixMap.get(theme);
  // Find the previous teamid and increment it by 1 and use that as the new teamid
  const previousTeam = await prisma.team.findFirst({
    where: {
      teamid: {
        startsWith: teamidPrefix,
      },
    },
    orderBy: {
      teamid: "desc",
    },
  });

  const previousTeamId = previousTeam?.teamid;
  const previousTeamIdNumber = parseInt(previousTeamId?.substring(1)!) || 0;
  const newTeamId = teamidPrefix! + (previousTeamIdNumber + 1);

  // Validate the team data
  if (!name || !member1 || !theme) {
    res.status(400).send("Missing required fields");
    return;
  }
  const memberList = [member1, member2, member3].filter((m) => m);

  // Validate the number of team members
  if (memberList.length < 1 || memberList.length > 3) {
    res.status(400).send("Team must have between 1 and 3 members");
    return;
  }
  let submissionSuccess = false;
  try {
    // Save the team data to the database
    const team = await prisma.team.create({
      data: {
        name,
        teamid: newTeamId,
        theme,
        members: {
          create: memberList.map((name) => ({ name })),
        },
      },
      include: {
        members: true,
      },
    });
    submissionSuccess = true;
    res.render("addTeam", { data: { submissionSuccess, team } });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating team");
  }
});

// Get all teams from the database
app.get("/teams", async (req, res) => {
  const teams = await prisma.team.findMany({
    include: {
      members: true,
    },
  });
  res.json(teams);
});

app.get("/teams/:id", async (req, res) => {
  const { id } = req.params;
  const team = await prisma.team.findUnique({
    where: {
      id: String(id),
    },
    include: {
      members: true,
    },
  });
  res.render("team", { team });
});

app.put("/update", async (req, res) => {
  console.log(req.body);
  // const { score1, score2, score3, score4, notes } = req.body;
  // const team = await prisma.team.update({
  //   where: {
  //     id: String(id),
  //   },
  //   data: {
  //     Result: {
  //       create: {
  //         slot1: Number(score1),
  //         slot2: Number(score2),
  //         slot3: Number(score3),
  //         slot4: Number(score4),
  //         total:
  //           Number(score1) + Number(score2) + Number(score3) + Number(score4),
  //         notes,
  //       },
  //     },
  //   },
  //   include: {
  //     members: true,
  //   },
  // });
  // res.json(team);
});
// Get a teams by theme
app.get("/teams/theme/:theme", async (req, res) => {
  const { theme } = req.params;
  const teams = await prisma.team.findMany({
    where: {
      theme: {
        equals: theme,
        mode: "insensitive",
      },
    },
    include: {
      members: true,
    },
  });
  res.render("theme", { theme, teams });
});

const server = http.createServer(app);
server.listen(3001, "0.0.0.0", () => {
  console.log("Server is running on port 3001");
});
