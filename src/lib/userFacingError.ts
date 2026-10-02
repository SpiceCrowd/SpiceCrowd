export function userFacingError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message || /prisma|database|stack|trace|\.tsx|\.ts|node_modules|sql/i.test(message)) return fallback;
  if (/network|fetch|failed to fetch|timeout|abort/i.test(message)) return "We're having trouble connecting. Please check your connection and try again.";
  if (/401|unauthorized|authentication|session/i.test(message)) return "Your session has expired. Please sign in again to continue.";
  if (/403|forbidden|admin required/i.test(message)) return "You do not have permission to perform this action.";
  if (/404|not found/i.test(message)) return "We couldn't find that information. Please return to the shop and try again.";
  if (/409|already exists|conflict/i.test(message)) return "This action was already completed. Please refresh and try again.";
  if (/429|too many/i.test(message)) return "We're receiving a lot of requests. Please wait a moment and try again.";
  if (/payment|checkout|order/i.test(message)) return "We couldn't confirm your order. Please check your order status before trying again.";
  return message.length > 180 ? fallback : message;
}
