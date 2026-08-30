export function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    // Axios response error from backend
    if ("response" in error) {
      const response = (
        error as {
          response?: {
            status?: number;
            data?: { message?: string | string[]; error?: string };
          };
        }
      ).response;

      const message = response?.data?.message;
      if (Array.isArray(message) && message.length > 0) {
        return message.join(", ");
      }
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
      if (response?.data?.error) {
        return response.data.error;
      }
    }

    // Axios network / connection error
    if ("code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
        return "Connection timed out. Please check if the backend server is running and accessible.";
      }
      if (code === "ERR_NETWORK" || code === "ECONNREFUSED") {
        return "Cannot connect to server. Please check your network or server URL in .env.";
      }
    }

    if ("message" in error) {
      const msg = (error as { message?: string }).message;
      if (msg === "Network Error") {
        return "Cannot connect to server. Please verify backend is running.";
      }
    }
  }

  return fallback;
}
