import { createErrors } from "ripthrow";

export const Errors = createErrors({
  userNotFound: {
    message: (id: string) => `User '${id}' not found`,
    help: () => "Verify the user ID and try again",
    _metadata: { status: 404 },
  },
  nameRequired: {
    message: () => "Name is required",
    help: () => "Ensure the request body includes a 'name' field",
  },
  emailRequired: {
    message: () => "Email is required",
    help: () => "Ensure the request body includes an 'email' field",
  },
  userListFailed: {
    message: () => "Failed to list users",
  },
  userOrdersFailed: {
    message: (id: string) => `User '${id}' not found`,
    help: () => "Check that the user ID is correct",
    _metadata: { status: 404 },
  },
});

export type AppError = typeof Errors._type;
