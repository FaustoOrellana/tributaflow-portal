/**
 * Endpoint Anti-Enumeración de Verificación de Licencia — TributaFlow Pro v2.4.0.
 * Comparación constant-time y respuesta uniforme para no filtrar existencia de RUCs/licencias/correos.
 */

import {
    CATALOGO_OFICIAL_V240,
    calcularHmacSha256Hex,
    constanteTiempoIgualdad,
    esperarPisoTiempo,
    hexABytes,
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";

const CAMPOS_PERMITIDOS = ["license_key", "hwid", "ruc", "plan_id", "estaciones_autorizadas"];
const RESPUESTA_GENERICA_NO_VERIFICABLE = Object.freeze({
    ok: false,
    valid: false,
    code: "VERIFICATION_UNCONFIRMED",
    message: "No fue posible verificar la licencia con las credenciales suministradas.",
});

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 4096);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        if (typeof env?.LICENSE_HMAC_SECRET !== "string" || env.LICENSE_HMAC_SECRET.length < 32) {
            return jsonSegura({ ok: false, error: "SIGNING_SECRET_NOT_CONFIGURED" }, 503);
        }

        const {
            license_key: licenseKey,
            hwid,
            ruc,
            plan_id: planId = "ESTUDIO_PRO",
            estaciones_autorizadas: estAut = 2,
        } = body.data;

        const errCampos = validarCamposComunesLicense({ hwid, ruc, licenseKey });
        const planMeta = Object.prototype.hasOwnProperty.call(CATALOGO_OFICIAL_V240.planes, planId)
            ? CATALOGO_OFICIAL_V240.planes[planId]
            : null;
        const estNum = Number(estAut);
        if (errCampos || !hwid || !ruc || !licenseKey || !planMeta || !Number.isInteger(estNum) || estNum < 1) {
            return jsonSegura(RESPUESTA_GENERICA_NO_VERIFICABLE, 401);
        }

        const partes = String(licenseKey).split("-");
        if (partes.length !== 3) {
            return jsonSegura(RESPUESTA_GENERICA_NO_VERIFICABLE, 401);
        }

        const [, tokenPrefix, suppliedTagHex] = partes;
        const expectedFullHex = await calcularHmacSha256Hex(
            env.LICENSE_HMAC_SECRET,
            `${hwid}:${ruc}:${tokenPrefix}:${planMeta.id}:${estNum}`
        );
        const expectedTagHex = expectedFullHex.slice(0, 32).toUpperCase();

        const suppliedBytes = new TextEncoder().encode(suppliedTagHex);
        const expectedBytes = new TextEncoder().encode(expectedTagHex);
        const dummyHexCheck = hexABytes(expectedFullHex);

        if (!dummyHexCheck || !constanteTiempoIgualdad(suppliedBytes, expectedBytes)) {
            return jsonSegura(RESPUESTA_GENERICA_NO_VERIFICABLE, 401);
        }

        return jsonSegura(
            {
                ok: true,
                valid: true,
                version: "2.4.0",
                plan_id: planId,
                estaciones_autorizadas: Number(estAut),
            },
            200
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
