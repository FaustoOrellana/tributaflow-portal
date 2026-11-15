/**
 * Middleware Edge de Seguridad y Rate Limiting para TributaFlow Pro v2.4.0.
 */

import { SECURITY_HEADERS, jsonSegura } from "./_shared/security.js";

const RATE_STORE = new Map();
const MAX_TRACKED_IPS = 2000;

export function limpiarVentanaRateLimit(ip, ahoraMs, ventanaMs) {
    const actual = RATE_STORE.get(ip) || [];
    const vigentes = actual.filter((ts) => ahoraMs - ts < ventanaMs);
    if (vigentes.length === 0) {
        RATE_STORE.delete(ip);
    } else {
        RATE_STORE.set(ip, vigentes);
    }
    return vigentes;
}

export function aplicarCabecerasSeguridad(response, pathname) {
    const newHeaders = new Headers(response.headers);
    Object.entries(SECURITY_HEADERS).forEach(([clave, valor]) => {
        newHeaders.set(clave, valor);
    });
    if (pathname.startsWith("/api/")) {
        newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        newHeaders.set("Pragma", "no-cache");
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const pathname = url.pathname || "/";

    // Bloqueo preventivo de métodos HTTP riesgosos
    const method = request.method.toUpperCase();
    if (!["GET", "HEAD", "POST", "OPTIONS"].includes(method)) {
        return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
    }

    // Rate limiting estricto para rutas de API dinámicas (webhook/activación/verificación)
    if (pathname.startsWith("/api/") && pathname !== "/api/config_comercial.json") {
        const ip =
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "127.0.0.1";
        const ventanaMs = Number(env?.TF_RATE_WINDOW_MS || 60000);
        const maxReqs = Number(env?.TF_RATE_LIMIT_MAX || 25);
        const ahora = Date.now();

        if (RATE_STORE.size > MAX_TRACKED_IPS) {
            RATE_STORE.clear();
        }
        const historial = limpiarVentanaRateLimit(ip, ahora, ventanaMs);
        if (historial.length >= maxReqs) {
            const retrySec = Math.max(1, Math.ceil((ventanaMs - (ahora - historial[0])) / 1000));
            return jsonSegura(
                { ok: false, error: "RATE_LIMIT_EXCEEDED", retry_after_sec: retrySec },
                429,
                { "Retry-After": String(retrySec) }
            );
        }
        historial.push(ahora);
        RATE_STORE.set(ip, historial);
    }

    const upstreamResponse = await next();
    return aplicarCabecerasSeguridad(upstreamResponse, pathname);
}
