"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
function handler(req, res) {
    const dbUrl = process.env.DATABASE_URL || '';
    res.status(200).json({
        hasDbUrl: !!dbUrl && dbUrl.length > 0,
        dbUrlLength: dbUrl.length,
        dbUrlPrefix: dbUrl.substring(0, 15),
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
    });
}
//# sourceMappingURL=debug.js.map