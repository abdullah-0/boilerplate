export const getErrorMessage = (error: unknown, fallback = "An unexpected error occurred.") => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { data?: unknown; message?: unknown };

    if (typeof maybeError.data === "object" && maybeError.data !== null) {
      const dataWithMessage = maybeError.data as { message?: unknown; detail?: unknown };
      if (typeof dataWithMessage.message === "string") {
        return dataWithMessage.message;
      }
      if (typeof dataWithMessage.detail === "string") {
        return dataWithMessage.detail;
      }
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim().length > 0) {
      return maybeError.message;
    }
  }

  return fallback;
};
