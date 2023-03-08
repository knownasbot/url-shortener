import { createHash } from "crypto";
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

const codeChars = "abcdefghijklmnopqrstuvwxzABCDEFGHIJKLMNOPQRSTUVWXZ0123456789";

router.post("/api/short", limiter, async (req, res) => {
    let url: string;
    try {
        const validator = new URL(req.body.url);
        if (!/^https?:$/.test(validator.protocol)) throw 0;

        url = validator.href;
    } catch(e) {
        return res.status(400).send({
            success: false,
            message: "invalid URL"
        });
    }

    let code = "";
    for (let i = 0; i < 6; i++) {
        code += codeChars[Math.floor(Math.random() * codeChars.length)];
    }

    const hash = createHash("sha256").update(url).digest().toString("hex");

    try {
        const query = cacheManager.get(code) ?? await prisma.shortURL.findFirst({
            where: {
                hash
            }
        });

        if (query && typeof query != "number") {
            code = query.code;

            cacheManager.set(code, query);
        } else {
            const data = {
                url,
                code,
                hash
            };

            await prisma.shortURL.create({
                data
            });

            cacheManager.set(code, data);
        }
        
        return res.status(200).send({
            success: true,
            message: code
        });
    } catch(e) {
        console.error("[Database] Failed to short an URL:\n", e);

        return res.status(500).send({
            success: false,
            message: "failed to short the URL"
        });
    }
});

export default router;