import { createErrors } from "ripthrow";

export const Errors = createErrors({
  UserNotFound: {
    message: (id: string) => `User '${id}' not found`,
    help: () => "Verify the user ID and try again",
    _metadata: { status: 404 },
  },
  NameRequired: {
    message: () => "Name is required",
    help: () => "Ensure the request body includes a 'name' field",
    _metadata: { status: 400 },
  },
  EmailRequired: {
    message: () => "Email is required",
    help: () => "Ensure the request body includes an 'email' field",
    _metadata: { status: 400 },
  },
  UserListFailed: {
    message: () => "Failed to list users",
    _metadata: { status: 500 },
  },
});

export type AppError = typeof Errors._type;
