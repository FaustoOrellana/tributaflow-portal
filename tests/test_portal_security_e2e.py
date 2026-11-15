# -*- coding: utf-8 -*-
"""
Suite Rápida de Auditoría HTTP, DOM, Integridad Comercial y Ciberseguridad (AppSec / Red Team)
Portal Oficial TributaFlow Pro v2.4.0 (tributaflow.quoratec.com)
Ejecuta validación directa sin navegador ni dependencias externas (< 5s).
"""

from __future__ import annotations

import base64
import functools
import hashlib
import hmac
import http.server
import json
import os
import re
import secrets
import socketserver
import subprocess
import sys
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)

PORTAL_DIR = Path(__file__).resolve().parent.parent
VERBOSE = any(arg in ("-v", "--verbose", "-s") for arg in sys.argv[1:]) or os.environ.get("TF_E2E_VERBOSE") == "1"
HTTP_TIMEOUT_S = 5.0
SUBPROCESS_TIMEOUT_S = 5.0


def _log(msg: str) -> None:
    if VERBOSE:
        print(f"    [v] {msg}", flush=True)


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
    "PERSONAL_PRO": "$59",
    "CONTADOR_MASTER": "$139",
    "ESTUDIO_PRO": "$299",
    "ENTERPRISE_TEAM": "$890",
    "ENTERPRISE_CORP": "$1,490",
}

EXPECTED_DOWNLOADS = {
    "windows": (
        "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe",
        "2c9f35ef3ddd723456a389b1f6308d4176d86e099610ff520652b9d6a4ddfdaa",
    ),
    "macos": (
        "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_macOS.dmg",
        "cddc6830d5c0605f3d607edcb136b44ca779fcac731b612647841da10756181c",
    ),
    "linux": (
        "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Linux_amd64.deb",
        "7a98f9f50df57d96927522d5f792ec83d733b24d1bd90897167f207dc41cea98",
    ),
}

CSP_META_ESPERADA = (
    "default-src 'self'; script-src 'self'; style-src 'self'; "
    "img-src 'self' data:; font-src 'self'; connect-src 'self'; "
    "object-src 'none'; base-uri 'self'; form-action 'none';"
)


def _cargar_reglas_headers(headers_path: Path) -> list[tuple[str, list[tuple[str, str]]]]:
    """Parsea Cloudflare Pages `_headers` en reglas (prefijo, lista de cabeceras)."""
    rules: list[tuple[str, list[tuple[str, str]]]] = []
    current_pattern: str | None = None
    current_headers: list[tuple[str, str]] = []
    for raw_line in headers_path.read_text(encoding="utf-8").splitlines():
        if not raw_line.strip() or raw_line.strip().startswith("#"):
            continue
        if not raw_line[0].isspace():
            if current_pattern is not None:
                rules.append((current_pattern, current_headers))
            current_pattern = raw_line.strip()
            current_headers = []
        elif current_pattern is not None and ":" in raw_line:
            k, _, v = raw_line.strip().partition(":")
            current_headers.append((k.strip(), v.strip()))
    if current_pattern is not None:
        rules.append((current_pattern, current_headers))
    return rules


class _PortalSecurityHandler(http.server.SimpleHTTPRequestHandler):
    """Handler HTTP estático que replica exactamente las cabeceras de `_headers`."""

    header_rules: list[tuple[str, list[tuple[str, str]]]] = []

    def end_headers(self) -> None:
        req_path = urllib.parse.urlsplit(self.path).path or "/"
        for pattern, hdrs in self.header_rules:
            prefix = pattern.rstrip("*")
            if pattern == "/*" or req_path.startswith(prefix):
                for key, val in hdrs:
                    self.send_header(key, val)
        super().end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        pass


class _ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def iniciar_servidor_local(directorio: Path) -> tuple[_ThreadedTCPServer, int]:
    _PortalSecurityHandler.header_rules = _cargar_reglas_headers(directorio / "_headers")
    handler = functools.partial(_PortalSecurityHandler, directory=str(directorio))
    server = _ThreadedTCPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


class _PortalDOMInspector(HTMLParser):
    """Analizador DOM/HTML ligero para auditar etiquetas, SRI, enlaces, atributos e IDs."""

    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.hrefs: list[str] = []
        self.srcs: list[str] = []
        self.inline_events: list[str] = []
        self.inline_styles: list[str] = []
        self.inline_scripts: int = 0
        self.stylesheets: list[dict[str, str | None]] = []
        self.scripts: list[dict[str, str | None]] = []
        self.metas: list[dict[str, str | None]] = []
        self.checkout_plans: list[str] = []
        self.guide_tabs: list[str] = []
        self.guide_panels: list[str] = []
        self.classes: list[str] = []
        self.imgs: list[dict[str, str | None]] = []
        self.attrs_index: dict[str, list[str]] = {
            "data-scroll-top": [],
            "data-app-version-tag": [],
            "data-sha256-value": [],
            "data-sha256-copy": [],
            "data-nav-dropdown": [],
        }

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        t = tag.lower()
        attr_map = dict(attrs)
        if attr_map.get("id"):
            self.ids.add(str(attr_map["id"]))
        if attr_map.get("class"):
            self.classes.extend(str(attr_map["class"]).split())
        if "href" in attr_map and attr_map["href"] is not None:
            self.hrefs.append(attr_map["href"])
        if "src" in attr_map and attr_map["src"] is not None:
            self.srcs.append(attr_map["src"])
        if "style" in attr_map:
            self.inline_styles.append(f"<{tag} style={attr_map['style']!r}>")
        for k in attr_map:
            if k.lower().startswith("on"):
                self.inline_events.append(f"<{tag} {k}=...>")
            if k in self.attrs_index:
                self.attrs_index[k].append(str(attr_map[k] or ""))
        if attr_map.get("data-checkout-plan"):
            self.checkout_plans.append(str(attr_map["data-checkout-plan"]))
        if attr_map.get("data-guide-tab"):
            self.guide_tabs.append(str(attr_map["data-guide-tab"]))
        if attr_map.get("data-guide-panel"):
            self.guide_panels.append(str(attr_map["data-guide-panel"]))
        if t == "script":
            if attr_map.get("src"):
                self.scripts.append(attr_map)
            else:
                self.inline_scripts += 1
        elif t == "link" and (attr_map.get("rel") or "").lower() == "stylesheet":
            self.stylesheets.append(attr_map)
        elif t == "meta":
            self.metas.append(attr_map)
        elif t == "img":
            self.imgs.append(attr_map)


def _assert(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def _http_get(url: str) -> tuple[int, dict[str, str], bytes]:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
        headers = {k.lower(): v for k, v in resp.headers.items()}
        return resp.status, headers, resp.read()


def _sri_sha384(raw: bytes) -> str:
    return "sha384-" + base64.b64encode(hashlib.sha384(raw).digest()).decode("ascii")


def test_static_integrity_and_zero_legacy() -> dict[str, int]:
    print("[1/5] Auditoría estática de integridad, configuración v2.4.0, enlaces locales y cero regresiones...", flush=True)

    cfg_path = PORTAL_DIR / "api" / "config_comercial.json"
    _assert(cfg_path.is_file(), "Falta api/config_comercial.json")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    _assert(cfg.get("version") == "2.4.0", f"Versión JSON inesperada: {cfg.get('version')}")
    _assert(cfg.get("trial_dias") == 15, f"trial_dias esperado 15, recibido: {cfg.get('trial_dias')}")
    _assert(cfg.get("trial_rucs") == 60, f"trial_rucs esperado 60, recibido: {cfg.get('trial_rucs')}")
    _assert(cfg.get("precio_seat_extra_usd") == 150.0, "precio_seat_extra_usd esperado 150.0")
    _assert(cfg.get("payphone_links") == PAYPHONE_OFICIALES, f"PayPhone JSON alterado: {cfg.get('payphone_links')}")
    soporte = cfg.get("canal_soporte", {})
    _assert(soporte.get("whatsapp_numero") == "593996459771", "WhatsApp JSON alterado")
    _assert(soporte.get("correo") == "soportetributaflow@quoratec.com", "Correo JSON alterado")

    for os_k, (exp_u, exp_sha) in EXPECTED_DOWNLOADS.items():
        node = cfg.get("descargas", {}).get(os_k, {})
        _assert(node.get("url") == exp_u, f"URL {os_k} v2.4.0 inválida en config_comercial.json: {node.get('url')}")
        _assert(node.get("sha256") == exp_sha, f"SHA-256 {os_k} inválido en config_comercial.json: {node.get('sha256')}")

    headers_path = PORTAL_DIR / "_headers"
    _assert(headers_path.is_file(), "Falta archivo _headers")
    headers_txt = headers_path.read_text(encoding="utf-8")
    for req_header in [
        "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
        "X-Frame-Options: DENY",
        "frame-ancestors 'none'",
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
    ]:
        _assert(req_header in headers_txt, f"Falta cabecera HTTP de seguridad en _headers: {req_header}")

    _assert((PORTAL_DIR / "assets" / "qr-deuna.png").is_file(), "Falta assets/qr-deuna.png")

    legacy_patterns = {
        "version_2_3_0": re.compile(r"2\.3\.0|v230", re.I),
        "trial_14_dias": re.compile(r"14\s+d[ií]as|14d\b", re.I),
        "ruc_2": re.compile(r"\b2\s+RUCs?\b", re.I),
        "lineas_15_50_200": re.compile(r"\b(?:15|50|200)\s+l[ií]neas\b", re.I),
        "legacy_crypto": re.compile(r"\bEd25519\b|\bRSA-2048\b", re.I),
        "eula_word": re.compile(r"\bEULA\b", re.I),
        "unpinned_release": re.compile(r"releases/latest", re.I),
    }

    checked_files = [*PAGINAS_PORTAL, "assets/css/portal.css", "assets/js/portal.js", "api/config_comercial.json", "_headers"]
    for rel in checked_files:
        _log(f"Escaneo estático cero-regresión -> {rel}")
        text = (PORTAL_DIR / rel).read_text(encoding="utf-8")
        for pname, regex in legacy_patterns.items():
            hits = regex.findall(text)
            _assert(not hits, f"Referencia heredada ({pname}) detectada en {rel}: {hits[:5]}")

    parsed_pages: dict[str, _PortalDOMInspector] = {}
    for rel in PAGINAS_PORTAL:
        fpath = PORTAL_DIR / rel
        _assert(fpath.is_file(), f"Falta página HTML requerida: {rel}")
        html = fpath.read_text(encoding="utf-8")
        parser = _PortalDOMInspector()
        parser.feed(html)
        _assert(not parser.inline_styles, f"Atributos style inline prohibidos en {rel}: {parser.inline_styles[:3]}")
        _assert(not parser.inline_events, f"Handlers inline on* prohibidos en {rel}: {parser.inline_events}")
        _assert(parser.inline_scripts == 0, f"Bloques <script> inline prohibidos en {rel}")
        parsed_pages[rel] = parser

    broken_links: list[str] = []
    for rel, parser in parsed_pages.items():
        base_dir = (PORTAL_DIR / rel).parent
        for src in parser.srcs:
            if not src.startswith(("http://", "https://", "data:")):
                if not (base_dir / src).resolve().is_file():
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
            if frag and target_rel in parsed_pages and frag not in parsed_pages[target_rel].ids:
                broken_links.append(f"{rel} anchor missing: {href}")

    _assert(not broken_links, f"Enlaces o anclas rotas encontradas: {broken_links}")
    print(f"    -> OK: {len(PAGINAS_PORTAL)} HTML + config JSON + _headers verificados sin 404, XSS inline ni regresiones.", flush=True)
    return {"pages": len(PAGINAS_PORTAL), "checked_files": len(checked_files)}


def test_http_server_headers_and_sri(base_url: str) -> dict[str, int]:
    print("[2/5] Validación HTTP directa sobre servidor local (13 páginas, activos, CSP, HSTS, XFO y SRI sha384)...", flush=True)

    http_checks = 0

    _, css_hdrs, css_bytes = _http_get(f"{base_url}/assets/css/portal.css")
    _, js_hdrs, js_bytes = _http_get(f"{base_url}/assets/js/portal.js")
    _, _, qr_bytes = _http_get(f"{base_url}/assets/qr-deuna.png")
    _, _, cfg_bytes = _http_get(f"{base_url}/api/config_comercial.json")
    http_checks += 4

    _assert(len(css_bytes) > 1000 and len(js_bytes) > 1000 and len(qr_bytes) > 100, "Activos estáticos incompletos vía HTTP")
    _assert(json.loads(cfg_bytes.decode("utf-8")).get("version") == "2.4.0", "JSON servido por HTTP con versión inválida")

    expected_css_sri = _sri_sha384(css_bytes)
    expected_js_sri = _sri_sha384(js_bytes)
    _log(f"SRI calculado HTTP CSS: {expected_css_sri}")
    _log(f"SRI calculado HTTP JS : {expected_js_sri}")

    # Prueba negativa HTTP 404 real
    try:
        _http_get(f"{base_url}/__recurso_inexistente_404__.html")
        raise AssertionError("El servidor HTTP local no devolvió 404 para ruta inexistente")
    except urllib.error.HTTPError as exc:
        _assert(exc.code == 404, f"Código HTTP inesperado para inexistente: {exc.code}")
        http_checks += 1

    # Verificar todas las páginas HTML servidas vía HTTP + cabeceras de seguridad + SRI exacto
    for rel in PAGINAS_PORTAL:
        _log(f"HTTP GET -> /{rel}")
        status, hdrs, raw_html = _http_get(f"{base_url}/{rel}")
        http_checks += 1
        _assert(status == 200, f"HTTP {status} inesperado en {rel}")

        _assert(
            hdrs.get("strict-transport-security") == "max-age=63072000; includeSubDomains; preload",
            f"Falta/alterada HSTS en respuesta HTTP {rel}: {hdrs.get('strict-transport-security')}",
        )
        _assert(hdrs.get("x-frame-options") == "DENY", f"X-Frame-Options inválido en {rel}: {hdrs.get('x-frame-options')}")
        _assert(hdrs.get("x-content-type-options") == "nosniff", f"X-Content-Type-Options inválido en {rel}")
        _assert(hdrs.get("referrer-policy") == "strict-origin-when-cross-origin", f"Referrer-Policy inválido en {rel}")
        _assert("camera=()" in hdrs.get("permissions-policy", ""), f"Permissions-Policy ausente en {rel}")
        http_csp = hdrs.get("content-security-policy", "")
        _assert("frame-ancestors 'none'" in http_csp and "object-src 'none'" in http_csp, f"CSP HTTP débil en {rel}: {http_csp}")

        html = raw_html.decode("utf-8")
        dom = _PortalDOMInspector()
        dom.feed(html)

        csp_metas = [m.get("content") for m in dom.metas if (m.get("http-equiv") or "").lower() == "content-security-policy"]
        _assert(csp_metas and csp_metas[0] == CSP_META_ESPERADA, f"Meta CSP inconsistente en {rel}: {csp_metas}")
        ref_metas = [m.get("content") for m in dom.metas if (m.get("name") or "").lower() == "referrer"]
        _assert(ref_metas and ref_metas[0] == "strict-origin-when-cross-origin", f"Meta Referrer inconsistente en {rel}")

        css_links = [s for s in dom.stylesheets if "portal.css" in (s.get("href") or "")]
        _assert(len(css_links) == 1, f"Falta stylesheet portal.css en {rel}")
        _assert(css_links[0].get("integrity") == expected_css_sri, f"SRI portal.css mismatch en {rel}: {css_links[0].get('integrity')}")
        _assert(css_links[0].get("crossorigin") == "anonymous", f"Falta crossorigin='anonymous' en portal.css de {rel}")

        js_tags = [s for s in dom.scripts if "portal.js" in (s.get("src") or "")]
        _assert(len(js_tags) == 1, f"Falta script portal.js en {rel}")
        _assert(js_tags[0].get("integrity") == expected_js_sri, f"SRI portal.js mismatch en {rel}: {js_tags[0].get('integrity')}")
        _assert(js_tags[0].get("crossorigin") == "anonymous", f"Falta crossorigin='anonymous' en portal.js de {rel}")
        _assert("defer" in js_tags[0], f"Script portal.js sin defer en {rel}")

    _assert("x-content-type-options" in css_hdrs and "x-content-type-options" in js_hdrs, "Activos JS/CSS sin nosniff")
    print(f"    -> OK: {http_checks} peticiones HTTP verificadas (13 HTML + 4 activos + 404, HSTS/XFO/CSP y SRI SHA-384 100 % exacto).", flush=True)
    return {"http_checks": http_checks}


def test_dom_plans_payments_and_navigation(base_url: str) -> dict[str, int]:
    print("[3/5] Auditoría DOM vía HTTP: 9 Módulos, 5 Planes v2.4.0, PayPhone/Correos/WhatsApp, Descargas SHA-256 y Guía/Políticas...", flush=True)

    pages_html: dict[str, tuple[str, _PortalDOMInspector]] = {}
    for rel in PAGINAS_PORTAL:
        _, _, raw = _http_get(f"{base_url}/{rel}")
        html = raw.decode("utf-8")
        dom = _PortalDOMInspector()
        dom.feed(html)
        pages_html[rel] = (html, dom)

        _log(f"DOM comercial/navegación -> {rel}")
        viewport_metas = [m.get("content") or "" for m in dom.metas if (m.get("name") or "").lower() == "viewport"]
        _assert(viewport_metas and "width=device-width" in viewport_metas[0], f"Falta meta viewport responsivo en {rel}")
        _assert("navToggle" in dom.ids and "navMenu" in dom.ids, f"Falta navbar móvil #navToggle/#navMenu en {rel}")
        _assert("nav-dropdown-trigger" in dom.classes and "nav-dropdown-panel" in dom.classes, f"Falta dropdown 9 Módulos en {rel}")
        _assert("pre-footer-cta" in dom.classes and "footer-grid-4" in dom.classes, f"Falta footer unificado en {rel}")
        _assert(dom.classes.count("footer-col") == 4, f"Footer no tiene exactamente 4 .footer-col en {rel}")
        _assert(bool(dom.attrs_index["data-scroll-top"]), f"Falta botón ↑ Subir en {rel}")
        _assert(bool(dom.attrs_index["data-app-version-tag"]), f"Falta data-app-version-tag en {rel}")
        _assert("0996459771" in html and "593996459771" in html, f"Canal WhatsApp oficial alterado o ausente en {rel}")
        _assert("soportetributaflow@quoratec.com" in html, f"Correo soporte oficial alterado o ausente en {rel}")
        # Protección QR: no debe exponerse qr-deuna.png directamente en el DOM HTML fuera del modal dinámico
        _assert(not any("qr-deuna" in (img.get("src") or "") for img in dom.imgs), f"QR Deuna expuesto estáticamente en HTML de {rel}")

    # Validar CSS servido vía HTTP (reset dropdown + z-index + responsivo + caja SHA-256)
    _, _, css_raw = _http_get(f"{base_url}/assets/css/portal.css")
    css_txt = css_raw.decode("utf-8")
    for css_snippet in [
        "appearance: none",
        "z-index: 9999",
        "@media (max-width: 768px)",
        ".os-sha-box",
        ".os-verify-cmd",
    ]:
        _assert(css_snippet in css_txt, f"Falta regla CSS requerida ({css_snippet}) en assets/css/portal.css")

    # Validar index.html y planes.html contra especificaciones comerciales exactas v2.4.0
    for comerciales_rel in ("index.html", "planes.html"):
        html, dom = pages_html[comerciales_rel]
        _log(f"Reglas comerciales 5 planes + prueba 15d/60 RUCs -> {comerciales_rel}")
        _assert("15 días" in html and "60 RUCs" in html, f"Falta prueba oficial 15 días / 60 RUCs en {comerciales_rel}")
        for plan_id, price in PRECIOS_ESPERADOS.items():
            _assert(plan_id in dom.checkout_plans, f"Falta botón data-checkout-plan='{plan_id}' en {comerciales_rel}")
            _assert(price in html, f"Falta precio {price} en {comerciales_rel}")
        _assert("$150" in html, f"Falta tarifa add-on +$150/PC extra en {comerciales_rel}")

    _, planes_dom = pages_html["planes.html"]
    for id_req in ("corpAddonMenos", "corpAddonMas", "corpAddonPcs", "corpAddonTotal", "btnCorpAddonCheckout"):
        _assert(id_req in planes_dom.ids, f"Falta control calculadora Corp #{id_req} en planes.html")

    # Simulador y bloque descargas verificadas v2.4.0 en index.html
    index_html, index_dom = pages_html["index.html"]
    for sim_id in ("simRucsRange", "simDocsRange", "simPlanNombre", "simBtnAdquirirPlan"):
        _assert(sim_id in index_dom.ids, f"Falta elemento simulador #{sim_id} en index.html")
    _assert("btnDescargaDetectada" in index_dom.ids, "Falta botón descarga #btnDescargaDetectada en index.html")
    for os_k, (expected_url, expected_sha) in EXPECTED_DOWNLOADS.items():
        _assert(expected_url in index_dom.hrefs, f"Falta enlace descarga v2.4.0 de {os_k} en index.html")
        _assert(os_k in index_dom.attrs_index["data-sha256-value"], f"Falta [data-sha256-value='{os_k}'] en index.html")
        _assert(os_k in index_dom.attrs_index["data-sha256-copy"], f"Falta [data-sha256-copy='{os_k}'] en index.html")
        _assert(expected_sha in index_html, f"Falta SHA-256 de {os_k} ({expected_sha}) en index.html")

    # guia-uso.html: 5 pestañas operativas completas
    guia_html, guia_dom = pages_html["guia-uso.html"]
    for tab_id, expected_snippet in [
        ("1pc", "25 RUCs"),
        ("2pcs", "30 RUCs"),
        ("lan", "Red LAN TCP/IP"),
        ("corp", "+$150/PC extra"),
        ("rapida", "SmartScreen"),
    ]:
        _assert(tab_id in guia_dom.guide_tabs, f"Falta pestaña guía '{tab_id}' en guia-uso.html")
        _assert(tab_id in guia_dom.guide_panels, f"Falta panel guía '{tab_id}' en guia-uso.html")
        _assert(expected_snippet in guia_html, f"Falta detalle '{expected_snippet}' en guia-uso.html")

    # politicas.html: 6 cláusulas legales y cero siglas EULA
    pol_html, pol_dom = pages_html["politicas.html"]
    _assert(pol_dom.classes.count("legal-clause-card") == 6, "Se esperaban 6 cláusulas .legal-clause-card en politicas.html")
    _assert("Acuerdo de Licencia de Usuario Final y Condiciones de Uso" in pol_html, "Falta título legal oficial en español en politicas.html")
    _assert("EULA" not in pol_html.upper(), "Sigla prohibida EULA detectada en politicas.html")

    print("    -> OK: 13 DOMs HTTP, 5 planes ($59-$1,490+$150/PC), PayPhone/WhatsApp/Correo intactos y SHA-256 v2.4.0 verificados.", flush=True)
    return {"dom_pages": len(pages_html), "plans_verified": len(PRECIOS_ESPERADOS)}


def test_js_runtime_guards_and_os_matrix() -> dict[str, int]:
    print("[4/5] Ejecución JS segura (Node VM): Inmutabilidad, Prototype Pollution, Allowlist URLs y Matriz de SO...", flush=True)

    node_script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const code = fs.readFileSync('assets/js/portal.js', 'utf8');

let navState = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
  platform: 'Win32',
  maxTouchPoints: 0,
  userAgentData: { platform: 'Windows', mobile: false },
};

function Noop() {}
const sandbox = {
  console,
  URL,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Set,
  Map,
  RegExp,
  Date,
  Math,
  JSON,
  Error,
  TypeError,
  encodeURIComponent,
  decodeURIComponent,
  setTimeout,
  clearTimeout,
  Element: Noop,
  HTMLElement: Noop,
  HTMLAnchorElement: Noop,
  HTMLInputElement: Noop,
  MutationObserver: function() { return { observe() {}, disconnect() {} }; },
  navigator: {
    get userAgent() { return navState.userAgent; },
    get platform() { return navState.platform; },
    get maxTouchPoints() { return navState.maxTouchPoints; },
    get userAgentData() { return navState.userAgentData; },
  },
  location: {
    protocol: 'https:',
    hostname: 'tributaflow.quoratec.com',
    pathname: '/index.html',
    search: '',
    href: 'https://tributaflow.quoratec.com/index.html',
  },
  document: {
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { setAttribute() {}, appendChild() {}, addEventListener() {}, style: {}, dataset: {}, classList: { add() {}, remove() {}, contains() { return false; } } }; },
    documentElement: {},
    body: { appendChild() {} },
  },
  matchMedia() { return { matches: false }; },
  scrollTo() {},
  fetch: undefined,
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.top = sandbox;
sandbox.globalThis = sandbox;

vm.runInNewContext(code, sandbox, { filename: 'assets/js/portal.js', timeout: 2000 });
const sec = sandbox.__TF_SECURITY__;
assert.ok(sec, 'No se exportó window.__TF_SECURITY__');

// 1. Inmutabilidad + enlaces de pago y soporte intactos
assert.equal(Object.isFrozen(sec.CONFIG_COMERCIAL), true);
assert.equal(Object.isFrozen(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS), true);
assert.equal(Object.isFrozen(sec.PLANES_V240), true);
assert.equal(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.PERSONAL_PRO, 'https://ppls.me/5S1Y89pBi1vYHBTEgEzRA');
assert.equal(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.CONTADOR_MASTER, 'https://ppls.me/dxope7VBAjK5LR1mO4UitA');
assert.equal(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.ESTUDIO_PRO, 'https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg');
assert.equal(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.ENTERPRISE_TEAM, null);
assert.equal(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.ENTERPRISE_CORP, null);
assert.equal(sec.CONFIG_COMERCIAL.WHATSAPP_NUMERO, '593996459771');
assert.equal(sec.CONFIG_COMERCIAL.CORREO_SOPORTE, 'soportetributaflow@quoratec.com');

// 2. Prototype Pollution defense (mismo contexto VM de portal.js)
vm.runInContext(`
  Object.prototype.payphone = 'https://evil.example/hack';
  Object.prototype.EVIL_PLAN = { id: 'EVIL_PLAN', precioUsd: 1 };
  try {
    if (__TF_SECURITY__.resolverPlan('EVIL_PLAN') !== 'ESTUDIO_PRO') throw new Error('Prototype pollution bypass en resolverPlan');
    if (__TF_SECURITY__.esUrlPayphoneSegura('https://ppls.me.evil.com/5S1Y89pBi1vYHBTEgEzRA')) throw new Error('PayPhone spoofed host');
  } finally {
    delete Object.prototype.payphone;
    delete Object.prototype.EVIL_PLAN;
  }
`, sandbox);

// 3. Matriz allowlist URLs (15 maliciosas vs 8 legítimas)
const badUrls = [
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
  ['https://github.com/attacker/tributaflow-portal/releases/download/v2.4.0/x.exe', 'descarga'],
  ['https://github.com/FaustoOrellana/tributaflow-portal/releases/latest/download/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe', 'descarga'],
  ['https://tributaflow.quoratec.com.evil.com/#descargas', 'portal'],
];
for (const [u, kind] of badUrls) {
  assert.equal(sec.validarDestinoSeguro(u, kind), false, 'URL maliciosa permitida: ' + u);
}

const goodUrls = [
  ['https://ppls.me/5S1Y89pBi1vYHBTEgEzRA', 'payphone'],
  ['https://ppls.me/dxope7VBAjK5LR1mO4UitA', 'payphone'],
  ['https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg', 'payphone'],
  ['https://wa.me/593996459771?text=hola', 'whatsapp'],
  ['mailto:soportetributaflow@quoratec.com?subject=Test', 'correo'],
  ['https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe', 'descarga'],
  ['https://tributaflow.quoratec.com/#descargas', 'portal'],
];
for (const [u, kind] of goodUrls) {
  assert.equal(sec.validarDestinoSeguro(u, kind), true, 'URL legítima bloqueada: ' + u);
}

// 4. Sanitización XSS HWID
const cleaned = sec.sanitizarIdentificador('<script>alert(1)</script>"\' TF-AB12CD-99');
assert.ok(!/[<>'"]/.test(cleaned) && cleaned.includes('TF-AB12CD-99'), 'Sanitización HWID débil: ' + cleaned);

assert.equal(sec.PLANES_V240.PERSONAL_PRO.precioUsd, 59);
assert.equal(sec.PLANES_V240.CONTADOR_MASTER.precioUsd, 139);
assert.equal(sec.PLANES_V240.ESTUDIO_PRO.precioUsd, 299);
assert.equal(sec.PLANES_V240.ENTERPRISE_TEAM.precioUsd, 890);
assert.equal(sec.PLANES_V240.ENTERPRISE_CORP.precioUsd, 1490);
assert.equal(sec.CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD, 150);

// 5. Detección inteligente por SO (Windows táctil permitido; Android/iOS/iPadOS bloqueados)
const osProfiles = [
  ['Windows Desktop', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0, userAgentData: null }, false, true, ['windows']],
  ['Windows Touch 2-en-1', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 10, userAgentData: null }, false, true, ['windows']],
  ['macOS Desktop', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)', platform: 'MacIntel', maxTouchPoints: 0, userAgentData: null }, false, true, ['macos']],
  ['Linux Desktop', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', platform: 'Linux x86_64', maxTouchPoints: 0, userAgentData: null }, false, true, ['linux']],
  ['Android Mobile/Tablet', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)', platform: 'Linux armv8l', maxTouchPoints: 5, userAgentData: null }, true, false, ['android']],
  ['iPhone iOS', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5, userAgentData: null }, true, false, ['ios', 'ipados']],
  ['iPadOS Desktop Mode', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5, userAgentData: null }, true, false, ['ipados']],
];

for (const [label, nextNav, expMobile, expSupported, expIds] of osProfiles) {
  navState = nextNav;
  const info = sec.detectarInfoSistemaOperativo();
  assert.equal(info.esMovil, expMobile, label + ' esMovil');
  assert.equal(info.soportado, expSupported, label + ' soportado');
  assert.ok(expIds.includes(info.id), label + ' id=' + info.id);
}

console.log(JSON.stringify({ ok: true, blockedUrls: badUrls.length, goodUrls: goodUrls.length, osProfiles: osProfiles.length }));
"""

    res = subprocess.run(
        ["node", "-e", node_script],
        cwd=str(PORTAL_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=SUBPROCESS_TIMEOUT_S,
    )
    _assert(res.returncode == 0, f"Fallo Node VM portal.js ({res.returncode}): {res.stderr or res.stdout}")
    summary = json.loads(res.stdout.strip().splitlines()[-1])
    _log(f"Node VM verified -> {summary}")
    print(f"    -> OK: Inmutabilidad, Prototype Pollution, {summary['blockedUrls']}+{summary['goodUrls']} URLs allowlist, XSS HWID y {summary['osProfiles']} perfiles SO aprobados.", flush=True)
    return summary


def test_edge_api_anti_tampering_and_security() -> dict[str, int]:
    print("[5/5] Pruebas AppSec Edge API (HMAC PayPhone, Anti-Tampering Precios/Planes, SQLi/NoSQLi/XSS/SSRF y Anti-Enumeración)...", flush=True)

    env = os.environ.copy()
    payphone_secret = secrets.token_hex(32)
    license_secret = secrets.token_hex(32)
    env["PAYPHONE_WEBHOOK_SECRET"] = payphone_secret
    env["LICENSE_HMAC_SECRET"] = license_secret
    env["TF_RATE_LIMIT_MAX"] = "60"
    env["TF_RATE_WINDOW_MS"] = "60000"

    def sign_body(secret: str, raw_body: str, ts: int | None = None) -> dict[str, str]:
        ts_val = int(time.time()) if ts is None else ts
        sig = hmac.new(secret.encode("utf-8"), f"{ts_val}.{raw_body}".encode("utf-8"), hashlib.sha256).hexdigest()
        return {"x-timestamp": str(ts_val), "x-signature-256": f"sha256={sig}"}

    proc = subprocess.Popen(
        ["node", "tests/edge_harness.mjs", "--stdio"],
        cwd=str(PORTAL_DIR),
        env=env,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    vectors_checked = 0
    try:
        assert proc.stdout is not None and proc.stdin is not None
        banner = proc.stdout.readline().strip()
        _assert(banner == "EDGE_HARNESS_STDIO_READY", f"Harness Edge no inició correctamente: {banner}")

        def call_edge(method: str, path: str, headers: dict[str, str] | None = None, body: Any = None, ip: str = "198.51.100.10") -> tuple[int, dict[str, str], str]:
            nonlocal vectors_checked
            vectors_checked += 1
            hdrs = dict(headers or {})
            hdrs.setdefault("x-forwarded-for", ip)
            raw_body = ""
            if isinstance(body, (dict, list)):
                raw_body = json.dumps(body, separators=(",", ":"))
                hdrs.setdefault("content-type", "application/json")
            elif isinstance(body, str):
                raw_body = body
            proc.stdin.write(json.dumps({"method": method, "path": path, "headers": hdrs, "body": raw_body}) + "\n")
            proc.stdin.flush()
            line = proc.stdout.readline()
            _assert(bool(line), "El harness Edge cerró inesperadamente")
            out = json.loads(line)
            return int(out["status"]), {k.lower(): v for k, v in out["headers"].items()}, out["body"]

        # 1. HTTP Headers Edge + DELETE bloqueado (405) + Content-Type inválido (415)
        st, hdrs, _ = call_edge("GET", "/index.html", ip="198.51.100.11")
        _assert(st == 200 and hdrs.get("x-frame-options") == "DENY" and "max-age=63072000" in hdrs.get("strict-transport-security", ""), "Headers Edge ausentes")
        st_del, _, _ = call_edge("DELETE", "/api/license/verify", ip="198.51.100.12")
        _assert(st_del == 405, f"DELETE no rechazado con 405: {st_del}")
        st_ct, _, _ = call_edge("POST", "/api/license/activate", headers={"content-type": "text/plain"}, body="{}", ip="198.51.100.12")
        _assert(st_ct == 415, f"Content-Type text/plain no rechazado con 415: {st_ct}")

        # 2. Anti-tampering de precios / privilegios / prototype pollution en /api/license/activate
        tamper_price_raw = json.dumps({"plan_id": "ESTUDIO_PRO", "order_ref": "TF-TAMPER-1", "hwid": "A1B2-C3D4-E5F6", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1", "precio": 1}, separators=(",", ":"))
        st_price, _, _ = call_edge("POST", "/api/license/activate", headers={"content-type": "application/json", **sign_body(license_secret, tamper_price_raw)}, body=tamper_price_raw)
        _assert(st_price == 403, f"Price tampering aceptado: HTTP {st_price}")

        tamper_priv_raw = json.dumps({"plan_id": "PERSONAL_PRO", "order_ref": "TF-PRIV-1", "hwid": "A1B2-C3D4-E5F6", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1", "rucs_max": 9999}, separators=(",", ":"))
        st_priv, _, _ = call_edge("POST", "/api/license/activate", headers={"content-type": "application/json", **sign_body(license_secret, tamper_priv_raw)}, body=tamper_priv_raw)
        _assert(st_priv == 403, f"Privilege escalation rucs_max aceptado: HTTP {st_priv}")

        proto_raw = '{"__proto__":{"admin":true},"plan_id":"PERSONAL_PRO"}'
        st_pp_json, _, _ = call_edge("POST", "/api/license/activate", headers={"content-type": "application/json", **sign_body(license_secret, proto_raw)}, body=proto_raw)
        _assert(st_pp_json == 403, f"Prototype pollution JSON no rechazado con 403: HTTP {st_pp_json}")

        # Cálculo autoritativo Enterprise Corporativo + 2 PCs extra = $1,790.00 y 12 PCs
        corp_raw = json.dumps({
            "plan_id": "ENTERPRISE_CORP",
            "order_ref": "TF-CORP-2401",
            "hwid": "CORP-HOST-01",
            "ruc": "1790012345001",
            "email": "ti@empresa.com.ec",
            "payment_channel": "TRANSFERENCIA",
            "voucher_ref": "PICH-998877",
            "extra_seats": 2,
        }, separators=(",", ":"))
        st_ok, api_hdrs, body_ok = call_edge("POST", "/api/license/activate", headers={"content-type": "application/json", **sign_body(license_secret, corp_raw)}, body=corp_raw)
        _assert(st_ok == 200 and "no-store" in api_hdrs.get("cache-control", ""), f"Activación legítima falló: {st_ok} {body_ok}")
        act_data = json.loads(body_ok)
        _assert(act_data.get("monto_autorizado_usd") == 1790 and act_data.get("estaciones_autorizadas") == 12, f"Cálculo servidor erróneo: {act_data}")
        lic_key = act_data["license_key"]

        # Fuzzing XSS / SQLi / NoSQLi / SSRF en /api/license/activate
        for attack_name, payload in [
            ("XSS", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-XSS1", "hwid": "<script>alert(1)</script>", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
            ("SQLi", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-SQL1", "hwid": "A1B2' OR '1'='1", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
            ("NoSQLi", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-NOSQL1", "hwid": "ABCD-1234", "ruc": "1790012345001", "email": "a$gt@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
            ("SSRF", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-SSRF1", "hwid": "http://169.254.169.254/latest", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
        ]:
            evil_raw = json.dumps(payload, separators=(",", ":"))
            st_evil, _, _ = call_edge("POST", "/api/license/activate", headers={"content-type": "application/json", **sign_body(license_secret, evil_raw)}, body=evil_raw)
            _assert(st_evil in (400, 403), f"Ataque {attack_name} no bloqueado: HTTP {st_evil}")

        # 3. Verificación licencia + Anti-Enumeración uniforme
        good_verify = {"license_key": lic_key, "hwid": "CORP-HOST-01", "ruc": "1790012345001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12}
        st_v_ok, _, body_v_ok = call_edge("POST", "/api/license/verify", body=good_verify)
        _assert(st_v_ok == 200 and json.loads(body_v_ok).get("valid") is True, f"Verify legítimo falló: {st_v_ok} {body_v_ok}")

        st_v1, _, b_v1 = call_edge("POST", "/api/license/verify", body={"license_key": lic_key, "hwid": "OTRO-EQUIPO-00", "ruc": "1790012345001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12})
        st_v2, _, b_v2 = call_edge("POST", "/api/license/verify", body={"license_key": "TFLIC-00000000-00000000000000000000000000000000", "hwid": "OTRO-EQUIPO-00", "ruc": "1790012345001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12})
        _assert(st_v1 == 401 and st_v2 == 401 and b_v1 == b_v2, "Respuesta de verificación no es uniforme (riesgo de enumeración)")

        # 4. Webhook PayPhone: firma HMAC-SHA256 + anti-tampering amount_cents + Anti-Replay
        wh_payload = json.dumps({
            "transaction_id": "PP-TX-240901",
            "client_transaction_id": "TF-PERSONAL_PRO-2401",
            "plan_id": "PERSONAL_PRO",
            "amount_cents": 5900,
            "currency": "USD",
            "status_code": 3,
            "hwid": "A1B2-C3D4-E5F6",
            "extra_seats": 0,
        }, separators=(",", ":"))
        st_no_sig, _, _ = call_edge("POST", "/api/webhook/payphone", headers={"content-type": "application/json"}, body=wh_payload)
        _assert(st_no_sig == 401, f"Webhook sin firma aceptado: HTTP {st_no_sig}")

        wh_tamper = json.dumps({
            "transaction_id": "PP-TX-240902",
            "client_transaction_id": "TF-PERSONAL_PRO-2402",
            "plan_id": "PERSONAL_PRO",
            "amount_cents": 100,
            "currency": "USD",
            "status_code": 3,
            "hwid": "A1B2-C3D4-E5F6",
        }, separators=(",", ":"))
        st_wh_tamper, _, _ = call_edge("POST", "/api/webhook/payphone", headers={"content-type": "application/json", **sign_body(payphone_secret, wh_tamper)}, body=wh_tamper)
        _assert(st_wh_tamper == 403, f"Tampering amount_cents en PayPhone aceptado: HTTP {st_wh_tamper}")

        wh_hdrs = {"content-type": "application/json", **sign_body(payphone_secret, wh_payload)}
        st_wh_ok, _, body_wh_ok = call_edge("POST", "/api/webhook/payphone", headers=wh_hdrs, body=wh_payload)
        _assert(st_wh_ok == 200 and json.loads(body_wh_ok).get("monto_verificado_usd") == 59, f"Webhook firmado válido rechazado: {st_wh_ok} {body_wh_ok}")

        st_wh_replay, _, _ = call_edge("POST", "/api/webhook/payphone", headers=wh_hdrs, body=wh_payload)
        _assert(st_wh_replay == 409, f"Anti-Replay webhook falló: HTTP {st_wh_replay}")

    finally:
        if proc.stdin and not proc.stdin.closed:
            proc.stdin.close()
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()

    _log(f"Vectores Edge verificados -> {vectors_checked}")
    print(f"    -> OK: {vectors_checked} transacciones/vectores Edge aprobados (HMAC, Anti-Tampering $1,790, Anti-Enumeración y SQLi/XSS).", flush=True)
    return {"edge_vectors": vectors_checked}


def main() -> int:
    server, port = iniciar_servidor_local(PORTAL_DIR)
    base_url = f"http://127.0.0.1:{port}"
    t0 = time.time()
    print(f"=== AUDITORÍA PORTAL TRIBUTAFLOW PRO v2.4.0 ({base_url}) ===", flush=True)

    reporte_fases: list[tuple[str, str, str]] = []
    exit_code = 1

    try:
        res_static = test_static_integrity_and_zero_legacy()
        reporte_fases.append(("1. Estática / v2.4.0 / Cero Regresiones", "PASS", f"{res_static['pages']} HTML + config + _headers"))

        res_http = test_http_server_headers_and_sri(base_url)
        reporte_fases.append(("2. HTTP / CSP / HSTS / XFO / SRI SHA-384", "PASS", f"{res_http['http_checks']} checks HTTP"))

        res_dom = test_dom_plans_payments_and_navigation(base_url)
        reporte_fases.append(("3. DOM / 5 Planes / PayPhone & Correos", "PASS", f"{res_dom['dom_pages']} DOMs, {res_dom['plans_verified']} planes"))

        res_js = test_js_runtime_guards_and_os_matrix()
        reporte_fases.append(("4. Node VM JS Guards / Allowlist / SO", "PASS", f"{res_js['blockedUrls']}+{res_js['goodUrls']} URLs, {res_js['osProfiles']} SO"))

        res_edge = test_edge_api_anti_tampering_and_security()
        reporte_fases.append(("5. Edge API HMAC & Anti-Tampering", "PASS", f"{res_edge['edge_vectors']} vectores Edge"))

        exit_code = 0
    except Exception as exc:
        reporte_fases.append(("EJECUCIÓN", "FAIL", f"{type(exc).__name__}: {exc}"))
        traceback.print_exc()
    finally:
        try:
            server.shutdown()
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

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
