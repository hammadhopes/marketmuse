
export const validate = (scheme) => (req, res, next) => {
    const result = scheme.safeParse(req.body);
    if(!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.issues[0].message
        });
    }
    req.body = result.data;

    next();
};