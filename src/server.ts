import express, {
  NextFunction,
  Request,
  Response as ExpressResponse,
} from "express";
import { promises as fs } from "node:fs";
import path from "node:path";

const VALIDATION_URL = "https://schoolbaseapp.com/validate-name";
const USERS_PATH = path.resolve(__dirname, "../data/users.json");

const app = express();

app.get("/health", (_req: Request, res: ExpressResponse) => {
  res.json({ status: "ok" });
});

app.get(
  "/api/validate-users",
  async (_req: Request, res: ExpressResponse, next: NextFunction) => {
    try {
      const users = await loadUsers();

      for (const name of users) {
        await validateUser(name);
      }

      res.json({ validated: users.length });
    } catch (error) {
      next(error);
    }
  },
);

app.use(
  (
    error: unknown,
    _req: Request,
    res: ExpressResponse,
    _next: NextFunction,
  ) => {
    if (res.headersSent) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while validating user names.";

    res.status(500).json({ error: message });
  },
);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

type RemoteResponse = {
  message?: string;
  name?: string;
};

async function loadUsers(): Promise<string[]> {
  const raw = await fs.readFile(USERS_PATH, "utf8");
  return JSON.parse(raw) as string[];
}

async function validateUser(name: string): Promise<void> {
  const normalizedName = name
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[\u201C\u201D]/g, '"'); 
  
  const url = `${VALIDATION_URL}?name=${encodeURIComponent(normalizedName)}`;

  let response: Response;

  try {
    response = await fetch(url);
  } catch (_error) {
    console.error(`${name} - Failed to reach validation service.`);
    process.exit(1);
  }

  const message = await extractMessage(response);

  if (response.status !== 200) {
    console.error(`${name} - ${message}`);
    process.exit(1);
  }

  console.log(`${name} - ${message}`);
}

async function extractMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as RemoteResponse;
    if (typeof payload?.message === "string") {
      return payload.message;
    }
  } catch (_error) {
  }

  return `Received status ${response.status}`;
}

export {};
