import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import prisma from "../libs/prisma";
import cacheManager from "../structures/cacheManager";

const router = Router();
const limiter = rateLimit({
    max: 30,
    windowMs: 5 * 60 * 1000,
    standardHeaders: true
});

router.get("/api/info", limiter, async (_, res) => {
    let count = 0;
    try {
        count = cacheManager.get("_count") as number;
        if (!count) {
            count = await prisma.shortURL.count();
            cacheManager.set("_count", count);
        }
    } catch(e) {
        console.log("[Database] Failed to query URL count:\n", e);

        return res.status(500).send({
            success: false,
            message: "failed query the URL count"
        });
    }

    return res.status(200).send({
        success: true,
        count
    });
});

router.get("/api/info/:id", limiter, async (req, res) => {
    const id = req.params.id;

    try {
        const query = await prisma.shortURL.findUnique({
            where: {
                code: id 
            }
        });

        if (query) {
            return res.status(200).send({
                success: true,
                data: {
                    code: query.code,
                    url: query.url,
                    createdAt: new Date(query.createdAt).toISOString()
                }
            });
        } else {
            return res.status(404).send({
                success: false,
                message: "code not found"
            });
        }
    } catch(e) {
        console.log("[Database] Failed to query a code:\n", e);

        return res.status(500).send({
            success: false,
            message: "failed to register the URL"
        });
    }
});

export default router;