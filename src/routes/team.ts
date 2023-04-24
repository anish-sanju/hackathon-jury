import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import pdf from "html-pdf";
import ejs from "ejs";
import path from "path";
const prisma = new PrismaClient();
const router = Router();

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
      marks: true,
    },
  });
  res.render("theme", { theme, teams });
});

// Create a new team
router.post("/create", async (req, res) => {
  const { name, teamid, college, member1, member2, member3, theme } = req.body;
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
        teamid,
        theme,
        college,
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

router.post("/:id/update", async (req, res) => {
  const { id } = req.params;
  // Update the scores for the team
  const { idea, technology, implementation, relevance, qa, notes } = req.body;
  // Retrieve the current total and marks
  const team = await prisma.team.findUnique({
    where: {
      id: String(id),
    },
    select: {
      id: true,
      teamid: true,
      name: true,
      theme: true,
      members: true,
      marks: true,
    },
  });
  // Calculate the new total
  const newTotal =
    Number(idea) +
    Number(technology) +
    Number(implementation) +
    Number(relevance) +
    Number(qa) +
    (team?.marks?.reduce(
      (total, mark) =>
        total +
        mark.idea +
        mark.technology +
        mark.implementation +
        mark.relevance +
        mark.qa,
      0
    ) || 0); // Add the previous total if it exists

  let updatedTeam;
  if (team) {
    updatedTeam = await prisma.team.update({
      where: {
        id: String(id),
      },
      data: {
        marks: {
          create: {
            idea: Number(idea),
            technology: Number(technology),
            implementation: Number(implementation),
            relevance: Number(relevance),
            qa: Number(qa),
            total:
              Number(idea) +
              Number(technology) +
              Number(implementation) +
              Number(relevance) +
              Number(qa),
            notes,
          },
        },
        total: newTotal,
        average: newTotal / 3,
      },
      select: {
        id: true,
        teamid: true,
        name: true,
        theme: true,
        members: true,
        marks: true,
        total: true,
      },
    });
  }
  res.redirect("/teams/theme/" + team?.theme);
});


router.get("/:theme/report", async (req, res) => {
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
      marks: true,
    },
    orderBy: {
      average: "desc"
    }
  });

  const data = {
    theme,
    teams,
  };
  res.render("report", { data });
});

export default router;
