export function requireSupportToken(req, _res, next) {
  const configuredToken =
    req.app?.locals?.supportToken ?? process.env.SUPPORT_TOKEN?.trim();

  if (!configuredToken) {
    const error = new Error('Support token is not configured on the server');
    error.status = 500;
    return next(error);
  }

  const providedHeader = req.headers['x-support-token'];
  const providedQuery = req.query.support_token;
  const provided =
    (Array.isArray(providedHeader) ? providedHeader[0] : providedHeader) ?? providedQuery ?? '';
  const normalizedProvided = provided.toString().trim();

  if (!normalizedProvided || normalizedProvided !== configuredToken) {
    const error = new Error('Missing or invalid support token');
    error.status = 401;
    return next(error);
  }

  return next();
}
