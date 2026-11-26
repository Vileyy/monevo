/**
 * Swagger is a development tool. It must never be exposed in production unless
 * an operator explicitly opts in with `SWAGGER_ENABLED=true`.
 */
export function isSwaggerEnabled(
  options: { nodeEnv?: string; swaggerEnabled?: string } = {},
): boolean {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const configured = (options.swaggerEnabled ?? process.env.SWAGGER_ENABLED)
    ?.trim()
    .toLowerCase();

  if (configured === 'true') return true;
  if (configured === 'false') return false;

  return nodeEnv !== 'production';
}
