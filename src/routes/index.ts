import { Router } from "express";

import prisma from "../libs/prisma";
import cacheManager from "../structures/cacheManager";

type ShortURLType = {
    url: string;
    code: string;
    hash: string;
};

const router = Router();

router.get("/:code", async (req, res) => {
    const code = req.params.code;
    if (code.length > 6) {
        return res.redirect("/");
    }

    try {
        let query = cacheManager.get(code) as ShortURLType;
        let redirectURL = "";

        if (!query) {
            query = await prisma.shortURL.findUnique({
                where: {
                    code 
                }
            }) as ShortURLType;

            if (query) {
                redirectURL = query.url;

                cacheManager.set(code, query);
            }
        } else {
            redirectURL = query.url;
        }

        if (redirectURL) {
            return res.redirect(redirectURL);
        } else {
            return res.redirect("/");
        }
    } catch(e) {
        console.log("[Database] Failed to query a code:\n", e);

        return res.sendStatus(500);
    }
});

export default router;