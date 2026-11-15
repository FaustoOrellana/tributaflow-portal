/**
 * Webhook Endurecido de PayPhone — TributaFlow Pro v2.4.0.
 * Verifica firma HMAC-SHA256, anti-replay, esquema estricto y monto autoritativo del servidor.
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
    "transaction_id",
    "client_transaction_id",
    "plan_id",
    "amount_cents",
    "currency",
    "status_code",
    "hwid",
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
];

const SEEN_TRANSACTIONS = new Map();

export async function onRequestPost(context) {
    const { request, env } = context;

    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const firma = await verificarFirmaHmacRequest(request, body.raw, env?.PAYPHONE_WEBHOOK_SECRET);
    if (!firma.ok) {
        return jsonSegura({ ok: false, error: firma.error }, firma.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const {
        transaction_id: transactionId,
        client_transaction_id: clientTxId,
        plan_id: planId,
        amount_cents: amountCents,
        currency,
        status_code: statusCode,
        hwid,
        extra_seats: extraSeats = 0,
    } = body.data;

    if (
        typeof transactionId !== "string" ||
        !/^[A-Z0-9_-]{6,64}$/i.test(transactionId) ||
        currency !== "USD" ||
        statusCode !== 3
    ) {
        return jsonSegura({ ok: false, error: "INVALID_PAYMENT_STATE_OR_TX" }, 400);
    }

    const errCampos = validarCamposComunesLicense({ hwid, orderRef: clientTxId });
    if (errCampos) {
        return jsonSegura({ ok: false, error: errCampos }, 400);
    }

    const cotizacion = calcularCotizacionAutoritativa(planId, extraSeats);
    if (!cotizacion.ok) {
        return jsonSegura({ ok: false, error: cotizacion.error }, 400);
    }

    if (!cotizacion.plan.payphoneUrl) {
        return jsonSegura({ ok: false, error: "PAYPHONE_NOT_APPLICABLE_FOR_PLAN" }, 400);
    }

    const expectedCents = Math.round(cotizacion.montoAutoritativoUsd * 100);
    if (!Number.isInteger(amountCents) || amountCents !== expectedCents) {
        return jsonSegura({ ok: false, error: "AMOUNT_MISMATCH_TAMPERING" }, 403);
    }

    // Protección anti-replay por ID de transacción
    const txKey = `${transactionId}:${clientTxId}`;
    if (SEEN_TRANSACTIONS.has(txKey)) {
        return jsonSegura({ ok: false, error: "DUPLICATE_WEBHOOK_REPLAY" }, 409);
    }
    if (SEEN_TRANSACTIONS.size > 5000) {
        SEEN_TRANSACTIONS.clear();
    }
    SEEN_TRANSACTIONS.set(txKey, firma.timestamp);

    const licenseSigningSecret = env?.LICENSE_HMAC_SECRET || env?.PAYPHONE_WEBHOOK_SECRET;
    const issuedAt = new Date().toISOString();
    const receiptCanonical = `${transactionId}|${cotizacion.plan.id}|${hwid}|${expectedCents}|${issuedAt}`;
    const receiptHmac = await calcularHmacSha256Hex(licenseSigningSecret, receiptCanonical);

    return jsonSegura(
        {
            ok: true,
            verified: true,
            plan_id: cotizacion.plan.id,
            monto_verificado_usd: cotizacion.montoAutoritativoUsd,
            rucs_max: cotizacion.plan.rucsMax,
            estaciones_autorizadas: cotizacion.estacionesAutorizadas,
            vigencia_dias: cotizacion.vigenciaDias,
            issued_at: issuedAt,
            receipt_signature: receiptHmac,
        },
        200
    );
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
