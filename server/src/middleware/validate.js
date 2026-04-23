export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err.errors || err.issues) {
      const issues = err.errors || err.issues;
      return res.status(400).json({
        message: 'Validation failed',
        errors: issues.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    console.error('Non-Zod error in validation middleware:', err);
    next(err);
  }
};
