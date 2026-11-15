/**
 * Harness local Node.js (sin dependencias externas) para validar Cloudflare Pages Functions
 * y el middleware Edge de seguridad HTTP en localhost.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import { onRequest as middlewareOnRequest } from "../functions/_middleware.js";
import * as payphoneFn from "../functions/api/webhook/payphone.js";
import * as activateFn from "../functions/api/license/activate.js";
import * as verifyFn from "../functions/api/license/verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
};

const ENV = {
    PAYPHONE_WEBHOOK_SECRET: process.env.PAYPHONE_WEBHOOK_SECRET || "",
    LICENSE_HMAC_SECRET: process.env.LICENSE_HMAC_SECRET || "",
    TF_RATE_LIMIT_MAX: process.env.TF_RATE_LIMIT_MAX || "25",
    TF_RATE_WINDOW_MS: process.env.TF_RATE_WINDOW_MS || "60000",
};

function resolverEstatico(pathname) {
    let rel = pathname === "/" ? "/index.html" : pathname;
    if (rel.startsWith("/")) rel = rel.slice(1);
    const resolved = path.resolve(ROOT_DIR, rel);
    if (!resolved.startsWith(ROOT_DIR + path.sep) && resolved !== ROOT_DIR) {
        return new Response("Forbidden", { status: 403 });
    }
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        return new Response("Not Found", { status: 404 });
    }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const data = fs.readFileSync(resolved);
    return new Response(data, { status: 200, headers: { "Content-Type": contentType } });
}

async function despacharFuncion(request, pathname) {
    const method = request.method.toUpperCase();
    const ctx = { request, env: ENV };

    if (pathname === "/api/webhook/payphone") {
        if (method === "POST" && typeof payphoneFn.onRequestPost === "function") {
            return payphoneFn.onRequestPost(ctx);
        }
        return payphoneFn.onRequest(ctx);
    }
    if (pathname === "/api/license/activate") {
        if (method === "POST" && typeof activateFn.onRequestPost === "function") {
            return activateFn.onRequestPost(ctx);
        }
        return activateFn.onRequest(ctx);
    }
    if (pathname === "/api/license/verify") {
        if (method === "POST" && typeof verifyFn.onRequestPost === "function") {
            return verifyFn.onRequestPost(ctx);
        }
        return verifyFn.onRequest(ctx);
    }

    return resolverEstatico(pathname);
}

async function ejecutarPipeline(method, pathname, headersObj, rawBodyBuf) {
    const fullUrl = `http://tributaflow.local${pathname || "/"}`;
    const urlObj = new URL(fullUrl);
    const headers = new Headers();
    Object.entries(headersObj || {}).forEach(([k, v]) => {
        if (typeof v === "string") headers.set(k, v);
        else if (Array.isArray(v)) headers.set(k, v.join(", "));
    });

    const upperMethod = String(method || "GET").toUpperCase();
    const webReq = new Request(fullUrl, {
        method: upperMethod,
        headers,
        body: ["GET", "HEAD"].includes(upperMethod) ? undefined : rawBodyBuf,
    });

    const webRes = await middlewareOnRequest({
        request: webReq,
        env: ENV,
        next: () => despacharFuncion(webReq, urlObj.pathname),
    });

    const outHeaders = {};
    webRes.headers.forEach((val, key) => {
        outHeaders[key] = val;
    });
    const outBuf = Buffer.from(await webRes.arrayBuffer());
    return { status: webRes.status, headers: outHeaders, bodyBuf: outBuf };
}

if (process.argv.includes("--stdio")) {
    const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    process.stdout.write("EDGE_HARNESS_STDIO_READY\n");
    rl.on("line", async (line) => {
        if (!line.trim()) return;
        try {
            const msg = JSON.parse(line);
            const rawBuf = Buffer.from(String(msg.body || ""), "utf8");
            const res = await ejecutarPipeline(msg.method, msg.path, msg.headers, rawBuf);
            process.stdout.write(
                JSON.stringify({
                    status: res.status,
                    headers: res.headers,
                    body: res.bodyBuf.toString("utf8"),
                }) + "\n"
            );
        } catch {
            process.stdout.write(
                JSON.stringify({ status: 500, headers: {}, body: '{"ok":false,"error":"HARNESS_ERROR"}' }) + "\n"
            );
        }
    });
} else {
    const server = http.createServer(async (req, res) => {
        try {
            const urlObj = new URL(`http://${req.headers.host || "127.0.0.1"}${req.url || "/"}`);
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const out = await ejecutarPipeline(req.method, urlObj.pathname + urlObj.search, req.headers, Buffer.concat(chunks));
            res.statusCode = out.status;
            Object.entries(out.headers).forEach(([k, v]) => res.setHeader(k, v));
            res.end(out.bodyBuf);
        } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }));
        }
    });

    const port = Number(process.env.EDGE_HARNESS_PORT || 0);
    server.listen(port, "127.0.0.1", () => {
        const addr = server.address();
        const boundPort = typeof addr === "object" && addr ? addr.port : port;
        process.stdout.write(`EDGE_HARNESS_READY http://127.0.0.1:${boundPort}\n`);
    });
}
