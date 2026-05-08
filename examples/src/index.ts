import express, { type Request, type Response, type NextFunction } from "express";
import { build, kindOf } from "ripthrow";
import * as users from "./users";

const app = express();
app.use(express.json());

app.get("/users", (_req, res, next) => {
  const r = build(users.list()).context("Failed to list users").result;

  if (!r.ok) return next(r.error);

  res.json({ data: r.value });
});

app.get("/users/:id", (req, res, next) => {
  const r = users.findById(req.params.id);

  if (!r.ok) return next(r.error);

  res.json({ data: r.value });
});

app.post("/users", (req, res, next) => {
  const r = users.create(req.body);

  if (!r.ok) return next(r.error);

  res.status(201).json({ data: r.value });
});

app.get("/users/:id/orders", (req, res, next) => {
  const r = build(users.findOrders(req.params.id))
    .context("Failed to load orders", "Check that the user ID is correct")
    .result;

  if (!r.ok) return next(r.error);

  res.json({ data: r.value });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const kind = kindOf(err);

  if (!kind) {
    console.error(err);

    res.status(500).json({ error: { message: "Internal server error", status: 500 } });

    return;
  }

  const meta = (err as Record<string, unknown>)["_metadata"]
    ?? (err as Record<string, unknown>)["context"]
    ?? {};
    
  const status = (meta as Record<string, unknown>)["status"] ?? 400;

  res.status(status as number).json({
    error: {
      message: err instanceof Error ? err.message : String(err),
      help: (err as { help?: string }).help ?? null,
      status,
    },
  });
});

app.listen(3000, () => console.log("API running on http://localhost:3000"));
