export function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const message = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}
