import express, { type Request, type Response, type NextFunction } from "express";
import { match, kindOf } from "ripthrow";
import * as users from "./users";
import { type AppError } from "./errors";

const app = express();
app.use(express.json());

app.get("/users", (_req, res, next) => {
  match(users.list(), {
    ok: (data) => res.json({ data }),
    err: (error) => next(error),
  });
});

app.get("/users/:id", (req, res, next) => {
  match(users.findById(req.params.id), {
    ok: (data) => res.json({ data }),
    err: (error) => next(error),
  });
});

app.post("/users", (req, res, next) => {
  match(users.create(req.body), {
    ok: (data) => res.status(201).json({ data }),
    err: (error) => next(error),
  });
});

app.get("/users/:id/orders", (req, res, next) => {
  match(users.findOrders(req.params.id), {
    ok: (data) => res.json({ data }),
    err: (error) => next(error),
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const kind = kindOf(err);

  if (!kind) {
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error", status: 500 } });
    return;
  }

  const appError = err as AppError;
  const status = appError._metadata?.status ?? 400;

  res.status(status as number).json({
    error: {
      message: appError.message,
      help: appError.help ?? null,
      status,
    },
  });
});

app.listen(3000, () => console.log("API running on http://localhost:3000"));
