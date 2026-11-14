# -*- coding: utf-8 -*-
"""
Suite Completa de Auditoría Funcional, UX Responsivo, Detección de SO y Ciberseguridad (AppSec / Red Team)
Portal Oficial TributaFlow Pro v2.4.0 (tributaflow.quoratec.com)
"""

from __future__ import annotations

import functools
import http.server
import json
import os
import re
import socketserver
import sys
import threading
import time
import traceback
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

PORTAL_DIR = Path(__file__).resolve().parent.parent

PAGINAS_PORTAL = [
    "index.html",
    "planes.html",
    "guia-uso.html",
    "politicas.html",
    "modulos/panel-general.html",
    "modulos/mis-contribuyentes.html",
    "modulos/sincronizar-sri.html",
    "modulos/importar-comprobantes.html",
    "modulos/auditor-fantasma.html",
    "modulos/busqueda-ruc.html",
    "modulos/consulta-masiva.html",
    "modulos/generador-ats.html",
    "modulos/ajustes-seguridad.html",
]

PAYPHONE_OFICIALES = {
    "PERSONAL_PRO": "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA",
    "CONTADOR_MASTER": "https://ppls.me/dxope7VBAjK5LR1mO4UitA",
    "ESTUDIO_PRO": "https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg",
    "ENTERPRISE_TEAM": None,
    "ENTERPRISE_CORP": None,
}

PRECIOS_ESPERADOS = {
    "PERSONAL_PRO": "$59.00",
    "CONTADOR_MASTER": "$139.00",
    "ESTUDIO_PRO": "$299.00",
    "ENTERPRISE_TEAM": "$890.00",
    "ENTERPRISE_CORP": "$1,490.00",
}

CSP_META_ESPERADA = (
    "default-src 'self'; script-src 'self'; style-src 'self'; "
    "img-src 'self' data:; font-src 'self'; connect-src 'self'; "
    "object-src 'none'; base-uri 'self'; form-action 'none';"
)


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        pass


class _ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def iniciar_servidor_local(directorio: Path) -> tuple[_ThreadedTCPServer, int]:
    handler = functools.partial(_QuietHandler, directory=str(directorio))
    server = _ThreadedTCPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


class _LinkAndIdExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.hrefs: list[str] = []
        self.srcs: list[str] = []
        self.inline_events: list[str] = []
        self.inline_styles: list[str] = []
        self.inline_scripts: int = 0
        self._in_script_no_src = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        if attr_map.get("id"):
            self.ids.add(str(attr_map["id"]))
        if "href" in attr_map and attr_map["href"] is not None:
            self.hrefs.append(attr_map["href"])
        if "src" in attr_map and attr_map["src"] is not None:
            self.srcs.append(attr_map["src"])
        if "style" in attr_map:
            self.inline_styles.append(f"<{tag} style={attr_map['style']!r}>")
        for k in attr_map:
            if k.lower().startswith("on"):
                self.inline_events.append(f"<{tag} {k}=...>")
        if tag.lower() == "script" and not attr_map.get("src"):
            self.inline_scripts += 1


def _assert(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def test_static_integrity_and_zero_legacy() -> dict[str, int]:
    print("[1/5] Auditoría estática de integridad, CSP, enlaces locales y cero regresiones...")

    cfg_path = PORTAL_DIR / "api" / "config_comercial.json"
    _assert(cfg_path.is_file(), "Falta api/config_comercial.json")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    _assert(cfg.get("version") == "2.4.0", f"Versión JSON inesperada: {cfg.get('version')}")
    _assert(cfg.get("trial_dias") == 14, f"trial_dias esperado 14, recibido: {cfg.get('trial_dias')}")
    _assert(cfg.get("precio_seat_extra_usd") == 150.0, "precio_seat_extra_usd esperado 150.0")
    _assert(cfg.get("payphone_links") == PAYPHONE_OFICIALES, f"PayPhone JSON alterado: {cfg.get('payphone_links')}")
    soporte = cfg.get("canal_soporte", {})
    _assert(soporte.get("whatsapp_numero") == "593996459771", "WhatsApp JSON alterado")
    _assert(soporte.get("correo") == "soportetributaflow@quoratec.com", "Correo JSON alterado")
    _assert(
        cfg.get("descargas", {}).get("windows", {}).get("url", "").endswith("TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe"),
        "URL Windows v2.4.0 inválida en config_comercial.json",
    )
    _assert(
        cfg.get("descargas", {}).get("macos", {}).get("url", "").endswith("TributaFlow_Pro_v2.4.0_macOS.dmg"),
        "URL macOS v2.4.0 inválida en config_comercial.json",
    )
    _assert(
        cfg.get("descargas", {}).get("linux", {}).get("url", "").endswith("TributaFlow_Pro_v2.4.0_Linux_amd64.deb"),
        "URL Linux v2.4.0 inválida en config_comercial.json",
    )

    headers_path = PORTAL_DIR / "_headers"
    _assert(headers_path.is_file(), "Falta archivo _headers")
    headers_txt = headers_path.read_text(encoding="utf-8")
    for req_header in ["X-Frame-Options: DENY", "frame-ancestors 'none'", "X-Content-Type-Options: nosniff", "Referrer-Policy: no-referrer"]:
        _assert(req_header in headers_txt, f"Falta cabecera HTTP de seguridad en _headers: {req_header}")

    _assert((PORTAL_DIR / "assets" / "qr-deuna.png").is_file(), "Falta assets/qr-deuna.png")

    legacy_patterns = {
        "version_2_3_0": re.compile(r"2\.3\.0|v230", re.I),
        "trial_15_dias": re.compile(r"15\s+d[ií]as", re.I),
        "ruc_1": re.compile(r"\b1\s+RUC\b", re.I),
        "ruc_15": re.compile(r"\b15\s+RUCs?\b", re.I),
        "ruc_50": re.compile(r"\b50\s+RUCs?\b", re.I),
        "eula_word": re.compile(r"\bEULA\b", re.I),
    }

    parsed_pages: dict[str, _LinkAndIdExtractor] = {}
    checked_files = [*PAGINAS_PORTAL, "assets/css/portal.css", "assets/js/portal.js", "api/config_comercial.json", "_headers"]

    for rel in checked_files:
        text = (PORTAL_DIR / rel).read_text(encoding="utf-8")
        for pname, regex in legacy_patterns.items():
            hits = regex.findall(text)
            _assert(not hits, f"Referencia heredada ({pname}) detectada en {rel}: {hits[:5]}")

    for rel in PAGINAS_PORTAL:
        fpath = PORTAL_DIR / rel
        _assert(fpath.is_file(), f"Falta página HTML requerida: {rel}")
        html = fpath.read_text(encoding="utf-8")

        _assert(CSP_META_ESPERADA in html, f"CSP estricta faltante o alterada en {rel}")
        _assert("'unsafe-inline'" not in html, f"Detectado unsafe-inline en {rel}")
        _assert("frame-ancestors" not in html, f"frame-ancestors no debe estar en <meta> CSP (solo HTTP _headers) en {rel}")
        _assert("github.com" not in html.lower(), f"Exposición indebida de GitHub en HTML público: {rel}")
        _assert("qr-deuna" not in html.lower(), f"El QR Deuna no debe renderizarse estáticamente en {rel}")

        # Canales oficiales & footer unificado
        _assert("0996459771" in html and "593996459771" in html, f"Falta canal WhatsApp oficial en {rel}")
        _assert("soportetributaflow@quoratec.com" in html, f"Falta correo oficial en {rel}")
        _assert('class="pre-footer-cta"' in html, f"Falta bloque pre-footer-cta en {rel}")
        _assert('class="footer-grid-4"' in html, f"Falta footer unificado de 4 columnas en {rel}")
        _assert('data-scroll-top' in html, f"Falta botón ↑ Subir en footer de {rel}")
        _assert(html.count('class="footer-col') == 4, f"Se esperaban 4 columnas .footer-col en {rel}")

        parser = _LinkAndIdExtractor()
        parser.feed(html)
        _assert(not parser.inline_styles, f"Atributos style inline prohibidos en {rel}: {parser.inline_styles[:3]}")
        _assert(not parser.inline_events, f"Handlers inline on* prohibidos en {rel}: {parser.inline_events}")
        _assert(parser.inline_scripts == 0, f"Bloques <script> inline prohibidos en {rel}")
        parsed_pages[rel] = parser

    # Verificar que todos los enlaces relativos y anclas locales existen
    broken_links: list[str] = []
    for rel, parser in parsed_pages.items():
        base_dir = (PORTAL_DIR / rel).parent
        for src in parser.srcs:
            if not src.startswith(("http://", "https://", "data:")):
                target = (base_dir / src).resolve()
                if not target.is_file():
                    broken_links.append(f"{rel} src={src}")
        for href in parser.hrefs:
            if href.startswith(("http://", "https://", "mailto:", "tel:")):
                if "ppls.me" in href:
                    _assert(href in PAYPHONE_OFICIALES.values(), f"PayPhone link alterado en {rel}: {href}")
                continue
            path_part, _, frag = href.partition("#")
            target_rel = rel if not path_part else os.path.normpath(str((base_dir.relative_to(PORTAL_DIR) / path_part))).replace("\\", "/")
            target_file = PORTAL_DIR / target_rel
            if not target_file.is_file():
                broken_links.append(f"{rel} href={href}")
                continue
            if frag and target_rel in parsed_pages:
                if frag not in parsed_pages[target_rel].ids:
                    broken_links.append(f"{rel} anchor missing: {href}")

    _assert(not broken_links, f"Enlaces o anclas rotas encontradas: {broken_links}")
    print(f"    -> OK: 13 páginas HTML + config JSON + _headers verificados sin 404, XSS inline ni regresiones.")
    return {"pages": len(PAGINAS_PORTAL), "checked_files": len(checked_files)}


def _attach_listeners(page: Page, base_url: str) -> tuple[list[str], list[str], list[str]]:
    console_errors: list[str] = []
    page_errors: list[str] = []
    failed_local_requests: list[str] = []

    def on_console(msg: Any) -> None:
        if msg.type == "error":
            console_errors.append(msg.text)

    def on_page_error(err: Any) -> None:
        page_errors.append(str(err))

    def on_response(resp: Any) -> None:
        if resp.url.startswith(base_url) and resp.status >= 400:
            failed_local_requests.append(f"HTTP {resp.status}: {resp.url}")

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.on("response", on_response)
    return console_errors, page_errors, failed_local_requests


def test_all_13_pages_desktop_tablet_mobile(browser: Browser, base_url: str) -> dict[str, int]:
    print("[2/5] Auditoría visual y responsiva en Desktop (1366), Tablet (780) y Móvil (375) sobre las 13 páginas...")
    checks = 0

    # Desktop 1366x768 sobre las 13 páginas
    ctx_desk = browser.new_context(viewport={"width": 1366, "height": 768}, device_scale_factor=1)
    try:
        for rel in PAGINAS_PORTAL:
            page = ctx_desk.new_page()
            console_errs, page_errs, net_errs = _attach_listeners(page, base_url)
            resp = page.goto(f"{base_url}/{rel}", wait_until="networkidle")
            _assert(resp is not None and resp.status == 200, f"HTTP error cargando {rel}")

            metrics = page.evaluate(
                """() => {
                    const doc = document.documentElement;
                    const bodyOverflow = doc.scrollWidth > window.innerWidth + 1;
                    const brokenImgs = Array.from(document.querySelectorAll('img')).filter((img) => {
                        const style = getComputedStyle(img);
                        return style.display !== 'none' && img.naturalWidth === 0;
                    }).map((img) => img.src);
                    const ddTrigger = document.querySelector('.nav-dropdown-trigger');
                    const panel = document.querySelector('.nav-dropdown-panel');
                    const ddBg = ddTrigger ? getComputedStyle(ddTrigger).backgroundColor : null;
                    const panelZ = panel ? parseInt(getComputedStyle(panel).zIndex || '0', 10) : 0;
                    const ddItems = document.querySelectorAll('.nav-dropdown-panel .nav-dropdown-item').length;
                    const qrInDom = Boolean(document.querySelector('img[src*="qr-deuna"]'));
                    const appVersion = document.querySelector('[data-app-version-tag]')?.textContent?.trim();
                    const wpVisible = Array.from(document.querySelectorAll('a[data-support-link="whatsapp"]')).some((a) => getComputedStyle(a).display !== 'none');
                    return {
                        scrollW: doc.scrollWidth,
                        innerW: window.innerWidth,
                        bodyOverflow,
                        brokenImgs,
                        ddBg,
                        panelZ,
                        ddItems,
                        qrInDom,
                        appVersion,
                        wpVisible,
                    };
                }"""
            )
            _assert(not metrics["bodyOverflow"], f"Overflow horizontal Desktop en {rel}: {metrics['scrollW']} > {metrics['innerW']}")
            _assert(not metrics["brokenImgs"], f"Imágenes rotas en {rel}: {metrics['brokenImgs']}")
            _assert(metrics["ddBg"] == "rgba(0, 0, 0, 0)", f"Botón 9 Módulos con fondo nativo en {rel}: {metrics['ddBg']}")
            _assert(metrics["panelZ"] >= 9999, f"z-index insuficiente en dropdown de {rel}: {metrics['panelZ']}")
            _assert(metrics["ddItems"] == 9, f"Faltan items en menú 9 Módulos de {rel}: {metrics['ddItems']}")
            _assert(not metrics["qrInDom"], f"QR Deuna visible fuera de modal en {rel}")
            _assert(metrics["appVersion"] == "v2.4.0", f"Versión DOM incorrecta en {rel}: {metrics['appVersion']}")
            _assert(metrics["wpVisible"], f"Botón soporte WhatsApp no visible en {rel}")

            # Hover + click + Escape en menú "9 Módulos" en escritorio
            trigger = page.locator(".nav-dropdown-trigger").first
            dd = page.locator("[data-nav-dropdown]").first
            trigger.click()
            _assert("is-open" in (dd.get_attribute("class") or ""), f"Dropdown no abrió al hacer click en {rel}")
            page.keyboard.press("Escape")
            _assert("is-open" not in (dd.get_attribute("class") or ""), f"Dropdown no cerró con Escape en {rel}")

            _assert(not console_errs, f"Console errors Desktop ({rel}): {console_errs}")
            _assert(not page_errs, f"Page errors Desktop ({rel}): {page_errs}")
            _assert(not net_errs, f"Network 4xx/5xx Desktop ({rel}): {net_errs}")
            page.close()
            checks += 1
    finally:
        ctx_desk.close()

    # Tablet 780x768 en páginas clave
    ctx_tab = browser.new_context(viewport={"width": 780, "height": 768}, device_scale_factor=1)
    try:
        for rel in ["index.html", "planes.html", "guia-uso.html", "politicas.html", "modulos/panel-general.html"]:
            page = ctx_tab.new_page()
            console_errs, page_errs, net_errs = _attach_listeners(page, base_url)
            page.goto(f"{base_url}/{rel}", wait_until="networkidle")
            overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
            _assert(not overflow, f"Overflow horizontal Tablet (780px) en {rel}")
            _assert(not console_errs and not page_errs and not net_errs, f"Errores en Tablet {rel}")
            page.close()
            checks += 1
    finally:
        ctx_tab.close()

    # Móvil 375x812 sobre las 13 páginas (menú hamburguesa + acordeón 9 Módulos + 0 overflow)
    ctx_mob = browser.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True, has_touch=True)
    try:
        for rel in PAGINAS_PORTAL:
            page = ctx_mob.new_page()
            console_errs, page_errs, net_errs = _attach_listeners(page, base_url)
            page.goto(f"{base_url}/{rel}", wait_until="networkidle")
            overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
            _assert(not overflow, f"Overflow horizontal Móvil (375px) en {rel}")

            page.click("#navToggle")
            _assert("is-open" in (page.locator("#navMenu").get_attribute("class") or ""), f"Menú hamburguesa no abrió en {rel}")
            page.click(".nav-dropdown-trigger")
            _assert("is-open" in (page.locator("[data-nav-dropdown]").get_attribute("class") or ""), f"Acordeón 9 Módulos no abrió en móvil en {rel}")
            page.click("#navToggle")

            _assert(not console_errs and not page_errs and not net_errs, f"Errores Móvil {rel}: {console_errs} {page_errs}")
            page.close()
            checks += 1
    finally:
        ctx_mob.close()

    print(f"    -> OK: {checks} renderizados verificados (13 Desktop + 5 Tablet + 13 Móvil), 0 errores, 0px overflow.")
    return {"viewports_checked": checks}


def test_interactive_flows_and_checkout(browser: Browser, base_url: str) -> dict[str, int]:
    print("[3/5] Pruebas funcionales: Simulador ahorro, Guía 5 pestañas, Calculadora Corp y 5 planes en Checkout...")
    ctx = browser.new_context(viewport={"width": 1366, "height": 768})
    ctx.grant_permissions(["clipboard-read", "clipboard-write"])
    try:
        # A) Simulador de ahorro en index.html
        page = ctx.new_page()
        console_errs, page_errs, net_errs = _attach_listeners(page, base_url)
        page.goto(f"{base_url}/index.html", wait_until="networkidle")

        page.click('button[data-sim-rucs="52"][data-sim-docs="1200"]')
        _assert("Estudio Contable Pro" in page.inner_text("#simPlanNombre"), "Simulador no recomendó Estudio Contable Pro para 52 RUCs")
        _assert(page.get_attribute("#simBtnAdquirirPlan", "data-checkout-plan") == "ESTUDIO_PRO", "Botón recomendador no actualizó data-checkout-plan a ESTUDIO_PRO")

        page.click('button[data-sim-rucs="3"][data-sim-docs="90"]')
        _assert("Personal Pro" in page.inner_text("#simPlanNombre"), "Simulador no recomendó Personal Pro para 3 RUCs")
        _assert(page.get_attribute("#simBtnAdquirirPlan", "data-checkout-plan") == "PERSONAL_PRO", "Botón no actualizó a PERSONAL_PRO")

        # Slider manual a 140 RUCs
        page.eval_on_selector("#simRucsRange", "el => { el.value = '140'; el.dispatchEvent(new Event('input', {bubbles:true})); }")
        _assert("Enterprise" in page.inner_text("#simPlanNombre"), "Slider a 140 RUCs no recomendó Enterprise")

        # Verify Checkout Modal across all 5 plans (Desktop)
        for plan_id, expected_price in PRECIOS_ESPERADOS.items():
            page.click(f'.plans-grid-5 button[data-checkout-plan="{plan_id}"]')
            _assert(page.locator("#modalPago").is_visible(), f"#modalPago no abrió para {plan_id}")
            _assert(expected_price in page.inner_text("#pagoMontoTotal"), f"Monto inesperado para {plan_id}: {page.inner_text('#pagoMontoTotal')}")

            # QR Deuna presente SOLO dentro del modal y cargado correctamente
            qr_ok = page.evaluate("() => { const img = document.getElementById('pagoQrDeunaImg'); return Boolean(img && img.complete && img.naturalWidth > 0); }")
            _assert(qr_ok, f"QR Deuna no cargó dentro del modal para {plan_id}")
            _assert("Fausto Andrés Orellana Jaén" in page.inner_text("#modalPago"), "Falta verificación titular Deuna!")

            # Plantilla Deuna con HWID + campos obligatorios + Soporte separado
            page.fill("#pagoHwidInput", "TF-A1B2C3-TEST01")
            wp_href = page.get_attribute("#btnEnviarComprobanteWp", "href") or ""
            mail_href = page.get_attribute("#btnEnviarComprobanteCorreo", "href") or ""
            _assert(wp_href.startswith("https://wa.me/593996459771?text="), f"WhatsApp comprobante inválido: {wp_href}")
            _assert(mail_href.startswith("mailto:soportetributaflow@quoratec.com?"), f"Mailto comprobante inválido: {mail_href}")
            decoded_wp = urllib.parse.unquote(wp_href)
            for req in ["TF-A1B2C3-TEST01", expected_price, "Comprobante", "RUC o Cédula", "archivo .lic"]:
                _assert(req in decoded_wp, f"Falta '{req}' en plantilla WhatsApp para {plan_id}")

            sup_wp = urllib.parse.unquote(page.get_attribute("#btnSoporteDeunaWp", "href") or "")
            _assert("consulta" in sup_wp.lower() and "obligatorio" not in sup_wp.lower(), "Canal de soporte Deuna mezclado con plantilla de pago")

            expected_payphone = PAYPHONE_OFICIALES[plan_id]
            if expected_payphone:
                _assert(page.locator("#pagoPayphonePanel").is_visible(), f"Panel PayPhone oculto para {plan_id}")
                actual_pph = page.get_attribute("#btnPagarPayphoneModal", "href")
                _assert(actual_pph == expected_payphone, f"PayPhone URL alterada para {plan_id}: {actual_pph}")
                _assert(page.locator("#btnPayphoneVoucherWp").is_visible(), "Falta Paso 2 PayPhone WhatsApp")
                _assert(page.locator("#btnPayphoneVoucherCorreo").is_visible(), "Falta Paso 2 PayPhone Correo")
                _assert(page.locator("#btnSoportePayphoneWp").is_visible(), "Falta Soporte oficial en columna PayPhone")
            else:
                _assert(not page.locator("#pagoPayphonePanel").is_visible(), f"Panel PayPhone debería ocultarse para {plan_id}")
                _assert(page.locator("#pagoEnterpriseLanPanel").is_visible(), f"Panel LAN corporativo oculto para {plan_id}")

            if plan_id == "ENTERPRISE_CORP":
                _assert(page.locator("#pagoExtraSeatsBar").is_visible(), "Falta selector +1 PC en modal ENTERPRISE_CORP")
                page.fill("#pagoExtraSeatsInput", "2")
                page.dispatch_event("#pagoExtraSeatsInput", "input")
                _assert("$1,790.00" in page.inner_text("#pagoMontoTotal"), "Cálculo +2 PCs extra erróneo en modal")
                _assert("12 PCs" in page.inner_text("#pagoEstacionesTotales"), "Etiqueta 12 PCs errónea en modal")

            page.click('#modalPago .btn-close')
            _assert(not page.locator("#modalPago").is_visible(), f"#modalPago no cerró para {plan_id}")

        _assert(not console_errs and not page_errs and not net_errs, f"Errores en index flows: {console_errs} {page_errs}")
        page.close()

        # B) planes.html + calculadora add-on +1 PC -> modalPago
        page_p = ctx.new_page()
        console_errs, page_errs, net_errs = _attach_listeners(page_p, base_url)
        page_p.goto(f"{base_url}/planes.html", wait_until="networkidle")
        _assert(page_p.inner_text("#corpAddonTotal") == "$1,640/año", f"Total inicial add-on inesperado: {page_p.inner_text('#corpAddonTotal')}")
        page_p.click("#corpAddonMas")
        _assert(page_p.inner_text("#corpAddonPcs") == "12 PCs", "Addon + no sumó a 12 PCs")
        _assert(page_p.inner_text("#corpAddonTotal") == "$1,790/año", "Addon + no actualizó a $1,790/año")
        page_p.click("#btnCorpAddonCheckout")
        _assert(page_p.locator("#modalPago").is_visible(), "Botón Addon no abrió modalPago")
        _assert("$1,790.00" in page_p.inner_text("#pagoMontoTotal"), "Modal no heredó $1,790.00 de la calculadora Addon")
        _assert(not console_errs and not page_errs and not net_errs, "Errores en planes.html")
        page_p.close()

        # C) guia-uso.html tabs + politicas.html clauses
        page_g = ctx.new_page()
        console_errs, page_errs, net_errs = _attach_listeners(page_g, base_url)
        page_g.goto(f"{base_url}/guia-uso.html", wait_until="networkidle")
        for tab_id, expected_snippet in [
            ("1pc", "25 RUCs"),
            ("2pcs", "30 RUCs por equipo"),
            ("lan", "LAN_SERVIDOR"),
            ("corp", "$150/año"),
            ("rapida", "SmartScreen"),
        ]:
            page_g.click(f'button[data-guide-tab="{tab_id}"]')
            panel_visible = page_g.locator(f'[data-guide-panel="{tab_id}"]').is_visible()
            _assert(panel_visible, f"Pestaña guía '{tab_id}' no mostró su panel")
            _assert(expected_snippet in page_g.inner_text(f'[data-guide-panel="{tab_id}"]'), f"Falta '{expected_snippet}' en pestaña {tab_id}")
        _assert(not console_errs and not page_errs and not net_errs, "Errores en guia-uso.html")
        page_g.close()

        page_l = ctx.new_page()
        console_errs, page_errs, net_errs = _attach_listeners(page_l, base_url)
        page_l.goto(f"{base_url}/politicas.html", wait_until="networkidle")
        _assert(page_l.locator(".legal-clause-card").count() == 6, "Se esperaban 6 cláusulas legales en politicas.html")
        body_text = page_l.inner_text("main")
        _assert("EULA" not in body_text.upper(), "Palabra EULA detectada en politicas.html")
        _assert("Acuerdo de Licencia de Usuario Final y Condiciones de Uso" in body_text, "Título legal en español ausente")
        _assert(not console_errs and not page_errs and not net_errs, "Errores en politicas.html")
        page_l.close()

    finally:
        ctx.close()

    print("    -> OK: Simulador, 5 planes checkout (Deuna QR protegido + PayPhone ppls.me + Addon Corp), Guía y Políticas aprobados.")
    return {"plans_verified": 5}


def test_os_detection_and_mobile_blocker(browser: Browser, base_url: str) -> dict[str, int]:
    print("[4/5] Matriz de Detección por SO (Windows/Touchscreen permitido vs Android/iPhone/iPadOS bloqueado sin GitHub)...")

    cases = [
        # (name, user_agent, platform, max_touch_points, expect_allowed, expected_modal)
        (
            "Windows Desktop",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            "Win32",
            0,
            True,
            "#modalDescargaWindows",
        ),
        (
            "Windows Laptop Táctil / Tablet 2-en-1",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            "Win32",
            10,
            True,
            "#modalDescargaWindows",
        ),
        (
            "macOS Desktop",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            "MacIntel",
            0,
            True,
            "#modalDescargaMacos",
        ),
        (
            "Linux Desktop",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            "Linux x86_64",
            0,
            True,
            "#modalDescargaLinux",
        ),
        (
            "Android Smartphone / Tablet",
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36",
            "Linux armv8l",
            5,
            False,
            "#modalMovilBloqueado",
        ),
        (
            "iPhone iOS",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
            "iPhone",
            5,
            False,
            "#modalMovilBloqueado",
        ),
        (
            "iPadOS Modo Escritorio (MacIntel + Touch 5)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
            "MacIntel",
            5,
            False,
            "#modalMovilBloqueado",
        ),
    ]

    for label, ua, platform, touch_pts, expect_allowed, expected_modal in cases:
        ctx = browser.new_context(viewport={"width": 1024 if expect_allowed else 390, "height": 768}, user_agent=ua, has_touch=touch_pts > 0)
        ctx.add_init_script(
            f"""
            Object.defineProperty(navigator, 'platform', {{ get: () => {json.dumps(platform)} }});
            Object.defineProperty(navigator, 'maxTouchPoints', {{ get: () => {touch_pts} }});
            """
        )
        try:
            page = ctx.new_page()
            console_errs, page_errs, net_errs = _attach_listeners(page, base_url)
            page.goto(f"{base_url}/index.html", wait_until="networkidle")

            # Click Hero primary download button
            page.click("#btnDescargaDetectada")
            _assert(page.locator(expected_modal).is_visible(), f"{label}: no abrió {expected_modal}")

            if expect_allowed:
                _assert(not page.locator("#modalMovilBloqueado").is_visible(), f"{label}: bloqueó erróneamente equipo de escritorio")
                modal_txt = page.inner_text(expected_modal).lower()
                _assert("github.com" not in modal_txt, f"{label}: expuso texto github.com en UI de modal")
            else:
                # Verificar modal amigable SIN ningún enlace o texto de GitHub
                modal_html = page.inner_html("#modalMovilBloqueado").lower()
                _assert("github.com" not in modal_html, f"{label}: ¡EXPOSICIÓN DE GITHUB EN MODAL MÓVIL!")
                _assert("https://tributaflow.quoratec.com/#descargas" in page.inner_text("#modalMovilUrlChip"), f"{label}: URL oficial ausente")
                wp_share_href = page.get_attribute("#btnMovilEnviarWp", "href") or ""
                _assert(wp_share_href.startswith("https://wa.me/?text="), f"{label}: Share WhatsApp inválido: {wp_share_href}")
                wp_decoded = urllib.parse.unquote(wp_share_href)
                _assert("https://tributaflow.quoratec.com/#descargas" in wp_decoded, f"{label}: Share WhatsApp sin enlace oficial")
                _assert("github" not in wp_decoded.lower(), f"{label}: Share WhatsApp contiene GitHub!")

                # Incluso haciendo click en tarjeta explícita de Windows desde móvil debe seguir bloqueando
                page.click('#modalMovilBloqueado .btn-close')
                page.click('.os-card[data-os="windows"] .btn-os-modal')
                _assert(page.locator("#modalMovilBloqueado").is_visible(), f"{label}: bypass posible pulsando botón Windows directo")

            _assert(not console_errs and not page_errs and not net_errs, f"{label}: errores console/net {console_errs} {page_errs}")
            page.close()
        finally:
            ctx.close()

    print(f"    -> OK: {len(cases)} perfiles de SO verificados (Laptop táctil Windows permitida, Android/iPhone/iPadOS bloqueados sin GitHub).")
    return {"os_profiles": len(cases)}


def test_red_team_security_hardening(browser: Browser, base_url: str) -> dict[str, int]:
    print("[5/5] Simulación Red Team Anti-Hacking (XSS, Poisoning, Prototype Pollution, DOM Clobbering, Hijacking, Clickjacking)...")
    vectors_passed = 0

    ctx = browser.new_context(viewport={"width": 1366, "height": 768})
    try:
        # 1. URL Query Poisoning + Open Redirect + Reflected XSS payload attempt
        page = ctx.new_page()
        alerts_triggered: list[str] = []
        page.on("dialog", lambda d: (alerts_triggered.append(d.message), d.dismiss()))

        poison_qs = (
            "url=https://evil.com&payphone=https://ppls.me.evil.com&next=javascript:alert(1)"
            "&whatsapp=https://wa.me/1111111111"
            "&plan=%3Cscript%3Ealert(1)%3C/script%3ECONTADOR_MASTER"
            "&hwid=%22%3E%3Csvg%20onload%3Dalert(2)%3ETF-123456-ABC"
        )
        page.goto(f"{base_url}/index.html?{poison_qs}", wait_until="networkidle")
        page.click('button[data-checkout-plan="ESTUDIO_PRO"]')
        _assert(not alerts_triggered, f"Vector 1 XSS disparó diálogo alert: {alerts_triggered}")
        _assert(page.get_attribute("#btnPagarPayphoneModal", "href") == PAYPHONE_OFICIALES["ESTUDIO_PRO"], "Query poisoning alteró PayPhone")
        _assert("593996459771" in (page.get_attribute("#btnEnviarComprobanteWp", "href") or ""), "Query poisoning alteró WhatsApp")
        vectors_passed += 1

        # 2. XSS en campo HWID input -> sanitización estricta
        page.fill("#pagoHwidInput", "<script>window.__XSS=1</script><img src=x onerror='window.__XSS=2'> TF-AB12CD-99")
        page.dispatch_event("#pagoHwidInput", "input")
        xss_flag = page.evaluate("window.__XSS || null")
        sanitized_val = page.input_value("#pagoHwidInput")
        _assert(xss_flag is None, f"XSS ejecutado en input HWID: {xss_flag}")
        _assert("<" not in sanitized_val and ">" not in sanitized_val and "'" not in sanitized_val, f"HWID no sanitizado: {sanitized_val}")
        page.click("#modalPago .btn-close")
        vectors_passed += 1

        # 3. Prototype Pollution resistance
        polluted_ok = page.evaluate(
            """() => {
                Object.prototype.payphone = 'https://evil-payphone.example/hack';
                Object.prototype.EVIL_PLAN = { id: 'EVIL_PLAN', precioUsd: 1 };
                Object.prototype.TEST_POLLUTED = 'yes';
                try {
                    const sec = window.__TF_SECURITY__;
                    const resPlan = sec.resolverPlan('EVIL_PLAN');
                    const badPay = sec.esUrlPayphoneSegura('https://ppls.me.evil.com/5S1Y89pBi1vYHBTEgEzRA');
                    const frozen = Object.isFrozen(sec.CONFIG_COMERCIAL) && Object.isFrozen(sec.PLANES_V240);
                    return { resPlan, badPay, frozen };
                } finally {
                    delete Object.prototype.payphone;
                    delete Object.prototype.EVIL_PLAN;
                    delete Object.prototype.TEST_POLLUTED;
                }
            }"""
        )
        _assert(polluted_ok["resPlan"] == "ESTUDIO_PRO", f"Prototype Pollution afectó resolverPlan: {polluted_ok}")
        _assert(polluted_ok["badPay"] is False, "Prototype Pollution engañó esUrlPayphoneSegura")
        _assert(polluted_ok["frozen"] is True, "CONFIG_COMERCIAL o PLANES_V240 no están congelados con Object.freeze")
        vectors_passed += 1

        # 4. Homograph / Spoofing / Scheme / Subdomain / Userinfo Rejection Matrix
        spoof_matrix = page.evaluate(
            """() => {
                const sec = window.__TF_SECURITY__;
                const bad = [
                    ['javascript:alert(1)', 'auto'],
                    ['JaVaScRiPt:alert(1)', 'payphone'],
                    ['data:text/html,<script>alert(1)<\\/script>', 'auto'],
                    ['vbscript:msgbox(1)', 'auto'],
                    ['http://ppls.me/5S1Y89pBi1vYHBTEgEzRA', 'payphone'],
                    ['https://ppls.me.attacker.com/5S1Y89pBi1vYHBTEgEzRA', 'payphone'],
                    ['https://user@ppls.me/5S1Y89pBi1vYHBTEgEzRA', 'payphone'],
                    ['https://ppls.me/NO_EXISTE_ID', 'payphone'],
                    ['https://wa.me/593000000000?text=fake', 'whatsapp'],
                    ['https://wa.me.evil.com/593996459771?text=x', 'whatsapp'],
                    ['https://wa.me/593999999999?text=phishing', 'whatsapp_share'],
                    ['mailto:attacker@evil.com', 'correo'],
                    ['https://github.com/attacker/tributaflow-portal/releases/latest/download/x.exe', 'descarga'],
                    ['https://tributaflow.quoratec.com.evil.com/#descargas', 'portal'],
                ];
                const good = [
                    ['https://ppls.me/5S1Y89pBi1vYHBTEgEzRA', 'payphone'],
                    ['https://ppls.me/dxope7VBAjK5LR1mO4UitA', 'payphone'],
                    ['https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg', 'payphone'],
                    ['https://wa.me/593996459771?text=hola', 'whatsapp'],
                    ['https://wa.me/?text=hola%20descargas', 'whatsapp_share'],
                    ['mailto:soportetributaflow@quoratec.com?subject=Test', 'correo'],
                    ['https://github.com/FaustoOrellana/tributaflow-portal/releases/latest/download/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe', 'descarga'],
                    ['https://tributaflow.quoratec.com/#descargas', 'portal'],
                ];
                return {
                    badResults: bad.map(([u, t]) => [u, sec.validarDestinoSeguro(u, t)]),
                    goodResults: good.map(([u, t]) => [u, sec.validarDestinoSeguro(u, t)]),
                };
            }"""
        )
        for u, ok in spoof_matrix["badResults"]:
            _assert(ok is False, f"URL maliciosa NO fue bloqueada por allowlist: {u}")
        for u, ok in spoof_matrix["goodResults"]:
            _assert(ok is True, f"URL oficial legítima fue bloqueada indebidamente: {u}")
        vectors_passed += 1

        # 5. Runtime DOM Hijacking (<script>, <iframe>, tampering href en enlace PayPhone/WhatsApp)
        hijack_res = page.evaluate(
            """() => {
                // Inyectar script e iframe ilegales
                const evilScript = document.createElement('script');
                evilScript.src = 'https://evil.example/payload.js';
                document.body.appendChild(evilScript);

                const evilIframe = document.createElement('iframe');
                evilIframe.src = 'https://evil.example/phish';
                document.body.appendChild(evilIframe);

                // Secuestrar href en un enlace protegido existente
                const wpLink = document.querySelector('a[data-tf-canal-seguro="whatsapp"]');
                if (wpLink) wpLink.setAttribute('href', 'https://attacker.evil/steal');

                return new Promise((resolve) => {
                    setTimeout(() => {
                        const scriptPresent = Boolean(document.querySelector('script[src*="evil.example"]'));
                        const iframePresent = Boolean(document.querySelector('iframe[src*="evil.example"]'));
                        const wpBlockedAttr = wpLink ? wpLink.getAttribute('data-tf-blocked') : null;
                        const wpHrefNow = wpLink ? wpLink.getAttribute('href') : null;
                        const tel = window.__TF_SECURITY__.obtenerTelemetria();
                        resolve({ scriptPresent, iframePresent, wpBlockedAttr, wpHrefNow, tel });
                    }, 80);
                });
            }"""
        )
        _assert(not hijack_res["scriptPresent"], "MutationObserver no eliminó <script> inyectado en DOM")
        _assert(not hijack_res["iframePresent"], "MutationObserver no eliminó <iframe> inyectado en DOM")
        _assert(hijack_res["wpBlockedAttr"] == "1" and hijack_res["wpHrefNow"] == "#bloqueado-por-seguridad", f"Enlace secuestrado no fue neutralizado: {hijack_res}")
        _assert(hijack_res["tel"]["blockedMutations"] >= 3, f"Telemetría de mutaciones bloqueadas insuficiente: {hijack_res['tel']}")
        vectors_passed += 1

        # 6. DOM Clobbering resistance
        clobber_ok = page.evaluate(
            """() => {
                const a = document.createElement('a');
                a.id = 'CONFIG_COMERCIAL';
                a.href = 'https://evil.clobber';
                const f = document.createElement('form');
                f.id = 'PLANES_V240';
                document.body.appendChild(a);
                document.body.appendChild(f);
                return window.__TF_SECURITY__.CONFIG_COMERCIAL.PAYPHONE_LINKS.PERSONAL_PRO;
            }"""
        )
        _assert(clobber_ok == PAYPHONE_OFICIALES["PERSONAL_PRO"], f"DOM Clobbering corrompió CONFIG_COMERCIAL: {clobber_ok}")
        vectors_passed += 1
        page.close()

        # 7. Anti-Clickjacking: embeber index.html en un <iframe>
        page_frame = ctx.new_page()
        page_frame.route(
            f"{base_url}/__frame_test.html",
            lambda route: route.fulfill(
                status=200,
                content_type="text/html; charset=utf-8",
                body=f"<!DOCTYPE html><html><body><iframe id='victim' src='{base_url}/index.html'></iframe></body></html>",
            ),
        )
        page_frame.goto(f"{base_url}/__frame_test.html", wait_until="networkidle")
        frame_obj = page_frame.frame(url=re.compile(r"/index\.html"))
        _assert(frame_obj is not None, "No se pudo inspeccionar el iframe de prueba")
        frame_blocked_text = frame_obj.inner_text("body")
        frame_tel = frame_obj.evaluate("window.__TF_SECURITY__.obtenerTelemetria()")
        _assert("Vista bloqueada por protección anti-clickjacking" in frame_blocked_text, f"No activó pantalla anti-clickjacking en iframe: {frame_blocked_text}")
        _assert(frame_tel["frameBlocked"] is True, f"frameBlocked no quedó registrado en telemetría: {frame_tel}")
        vectors_passed += 1
        page_frame.close()

    finally:
        ctx.close()

    print(f"    -> OK: {vectors_passed} vectores Red Team neutralizados con éxito (0 ejecuciones, 100 % bloqueo).")
    return {"security_vectors": vectors_passed}


def main() -> int:
    server, port = iniciar_servidor_local(PORTAL_DIR)
    base_url = f"http://127.0.0.1:{port}"
    t0 = time.time()
    print(f"=== AUDITORÍA PORTAL TRIBUTAFLOW PRO v2.4.0 ({base_url}) ===", flush=True)

    reporte_fases: list[tuple[str, str, str]] = []
    exit_code = 1
    browser: Browser | None = None

    try:
        res_static = test_static_integrity_and_zero_legacy()
        reporte_fases.append(("1. Estática / CSP / Enlaces / Sin Regresiones", "PASS", f"{res_static['pages']} páginas, {res_static['checked_files']} archivos"))

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                timeout=20000,
                args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
            )
            res_resp = test_all_13_pages_desktop_tablet_mobile(browser, base_url)
            reporte_fases.append(("2. Responsivo 1366/780/375 & Nav", "PASS", f"{res_resp['viewports_checked']} renderizados"))

            res_func = test_interactive_flows_and_checkout(browser, base_url)
            reporte_fases.append(("3. Flujos Interactivos & Checkout 5 Planes", "PASS", f"{res_func['plans_verified']} planes + Simulador/Guía/Políticas"))

            res_os = test_os_detection_and_mobile_blocker(browser, base_url)
            reporte_fases.append(("4. Detección SO & Bloqueo Móvil/iPadOS", "PASS", f"{res_os['os_profiles']} perfiles SO"))

            res_sec = test_red_team_security_hardening(browser, base_url)
            reporte_fases.append(("5. AppSec Red Team Anti-Hacking", "PASS", f"{res_sec['security_vectors']} vectores neutralizados"))

            try:
                browser.close()
            except Exception:
                pass
            browser = None

        exit_code = 0
    except Exception as exc:
        reporte_fases.append(("EJECUCIÓN", "FAIL", f"{type(exc).__name__}: {exc}"))
        traceback.print_exc()
    finally:
        if browser is not None:
            try:
                browser.close()
            except Exception:
                pass
        try:
            server.server_close()
        except Exception:
            pass

        elapsed = time.time() - t0
        estado_global = "PASS" if exit_code == 0 else "FAIL"
        print("\n=== REPORTE PASS/FAIL PORTAL TRIBUTAFLOW PRO v2.4.0 ===", flush=True)
        for nombre, estado, detalle in reporte_fases:
            print(f"  [{estado}] {nombre}: {detalle}", flush=True)
        print(f"RESULTADO GLOBAL: {estado_global} en {elapsed:.2f}s", flush=True)
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(exit_code)

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
