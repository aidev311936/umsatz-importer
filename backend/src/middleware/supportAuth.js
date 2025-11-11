const configuredToken = process.env.SUPPORT_TOKEN;

if (!configuredToken) {
  throw new Error('SUPPORT_TOKEN environment variable must be configured.');
}

export function requireSupportToken(req, _res, next) {
  const provided = req.headers['x-support-token'] || req.query.support_token;

  if (!provided || provided !== configuredToken) {
    const error = new Error('Missing or invalid support token');
    error.status = 401;
    return next(error);
  }

  return next();
}
