/**
 * Endpoint Endurecido de Emisión/Registro de Activación — TributaFlow Pro v2.4.0.
 * Rechaza manipulación de precio/descuento/días y exige firma HMAC-SHA256 del servidor emisor.
 */

import {
    calcularCotizacionAutoritativa,
    calcularHmacSha256Hex,
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
    verificarFirmaHmacRequest,
} from "../../_shared/security.js";

const CAMPOS_PERMITIDOS = [
    "plan_id",
    "order_ref",
    "hwid",
    "ruc",
    "email",
    "payment_channel",
    "voucher_ref",
    "extra_seats",
];

const CAMPOS_PROHIBIDOS_TAMPERING = [
    "price",
    "precio",
    "amount",
    "amount_usd",
    "monto",
    "discount",
    "descuento",
    "trial_days",
    "trial_dias",
    "dias",
    "vigencia_dias",
    "rucs_max",
    "estaciones_max",
    "is_paid",
    "status",
    "bypass_payment",
    "signature",
];

const CANALES_PERMITIDOS = new Set(["PAYPHONE", "DEUNA", "TRANSFERENCIA"]);
const VOUCHER_REGEX = /^[A-Z0-9-]{4,40}$/;

export async function onRequestPost(context) {
    const { request, env } = context;

    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const firma = await verificarFirmaHmacRequest(request, body.raw, env?.LICENSE_HMAC_SECRET);
    if (!firma.ok) {
        return jsonSegura({ ok: false, error: firma.error }, firma.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const {
        plan_id: planId,
        order_ref: orderRef,
        hwid,
        ruc,
        email,
        payment_channel: paymentChannel,
        voucher_ref: voucherRef,
        extra_seats: extraSeats = 0,
    } = body.data;

    if (
        !CANALES_PERMITIDOS.has(String(paymentChannel || "")) ||
        !VOUCHER_REGEX.test(String(voucherRef || ""))
    ) {
        return jsonSegura({ ok: false, error: "INVALID_PAYMENT_EVIDENCE" }, 400);
    }

    const errCampos = validarCamposComunesLicense({ hwid, orderRef, ruc, email });
    if (errCampos || !hwid || !orderRef || !ruc || !email) {
        return jsonSegura({ ok: false, error: errCampos || "MISSING_REQUIRED_FIELDS" }, 400);
    }

    const cotizacion = calcularCotizacionAutoritativa(planId, extraSeats);
    if (!cotizacion.ok) {
        return jsonSegura({ ok: false, error: cotizacion.error }, 400);
    }

    if (paymentChannel === "PAYPHONE" && !cotizacion.plan.payphoneUrl) {
        return jsonSegura({ ok: false, error: "PAYPHONE_NOT_APPLICABLE_FOR_PLAN" }, 400);
    }

    const issuedAtMs = Date.now();
    const expiresAtMs = issuedAtMs + cotizacion.vigenciaDias * 86400 * 1000;
    const keyTokenPrefix = orderRef.replace(/[^A-Z0-9]/g, "").padEnd(8, "0").slice(0, 12);
    const mac = await calcularHmacSha256Hex(
        env.LICENSE_HMAC_SECRET,
        `${hwid}:${ruc}:${keyTokenPrefix}:${cotizacion.plan.id}:${cotizacion.estacionesAutorizadas}`
    );

    return jsonSegura(
        {
            ok: true,
            version: "2.4.0",
            plan_id: cotizacion.plan.id,
            monto_autorizado_usd: cotizacion.montoAutoritativoUsd,
            rucs_max: cotizacion.plan.rucsMax,
            estaciones_autorizadas: cotizacion.estacionesAutorizadas,
            vigencia_dias: cotizacion.vigenciaDias,
            issued_at: new Date(issuedAtMs).toISOString(),
            expires_at: new Date(expiresAtMs).toISOString(),
            license_key: `TFLIC-${keyTokenPrefix}-${mac.slice(0, 32).toUpperCase()}`,
        },
        200
    );
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
