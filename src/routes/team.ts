import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

const teamidPrefixMap = new Map<string, string>([
    ["Healthcare", "H"],
    ["Finance", "F"],
    ["Social Innovation", "S"],
    ["Energy and Sustainability", "E"],
  ]);

router.get("/", async (req, res) => {
  const teams = await prisma.team.findMany({
    include: {
      members: true,
    },
  });
  res.render("teams", { teams });
});

router.get("/:id", async (req, res) => {
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

router.get("/theme/:theme", async (req, res) => {
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

// Create a new team
router.post("/create", async (req, res) => {
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
export default router;
