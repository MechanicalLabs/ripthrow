import { Ok, Err, type Result } from "ripthrow";
import { Errors, type AppError } from "./errors";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  userId: string;
  product: string;
  amount: number;
}

const db: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

const orderDb: Order[] = [
  { id: "o1", userId: "1", product: "Laptop", amount: 1200 },
  { id: "o2", userId: "1", product: "Mouse", amount: 25 },
];

export function list(): Result<User[], AppError> {
  return db.length ? Ok(db) : Err(Errors.UserListFailed());
}

export function findById(id: string): Result<User, AppError> {
  const user = db.find((u) => u.id === id);
  return user ? Ok(user) : Err(Errors.UserNotFound(id));
}

export function create(data: { name: string; email: string }): Result<User, AppError> {
  if (!data.name) return Err(Errors.NameRequired());
  if (!data.email) return Err(Errors.EmailRequired());

  const user: User = { id: String(db.length + 1), ...data };
  db.push(user);
  return Ok(user);
}

export function findOrders(userId: string): Result<Order[], AppError> {
  if (!db.some((u) => u.id === userId)) return Err(Errors.UserNotFound(userId));
  return Ok(orderDb.filter((o) => o.userId === userId));
}
