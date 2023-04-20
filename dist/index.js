"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const path = __importStar(require("path"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const node_http_1 = __importDefault(require("node:http"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path.join(__dirname, "public")));
app.use(express_ejs_layouts_1.default);
const teamidPrefixMap = new Map([
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
app.post("/team", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, member1, member2, member3, theme } = req.body;
    const teamidPrefix = teamidPrefixMap.get(theme);
    // Find the previous teamid and increment it by 1 and use that as the new teamid
    const previousTeam = yield prisma.team.findFirst({
        where: {
            teamid: {
                startsWith: teamidPrefix,
            },
        },
        orderBy: {
            teamid: "desc",
        },
    });
    const previousTeamId = previousTeam === null || previousTeam === void 0 ? void 0 : previousTeam.teamid;
    const previousTeamIdNumber = parseInt(previousTeamId === null || previousTeamId === void 0 ? void 0 : previousTeamId.substring(1)) || 0;
    const newTeamId = teamidPrefix + (previousTeamIdNumber + 1);
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
        const team = yield prisma.team.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error creating team");
    }
}));
// Get all teams from the database
app.get("/teams", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teams = yield prisma.team.findMany({
        include: {
            members: true,
        },
    });
    res.json(teams);
}));
app.get("/teams/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const team = yield prisma.team.findUnique({
        where: {
            id: String(id),
        },
        include: {
            members: true,
        },
    });
    res.render("team", { team });
}));
app.put("/update", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
// Get a teams by theme
app.get("/teams/theme/:theme", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { theme } = req.params;
    const teams = yield prisma.team.findMany({
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
}));
const server = node_http_1.default.createServer(app);
server.listen(3001, "0.0.0.0", () => {
    console.log("Server is running on port 3001");
});
