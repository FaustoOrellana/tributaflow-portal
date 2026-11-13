# -*- coding: utf-8 -*-
"""
Auditoría E2E Completa con Playwright — Portal Web TributaFlow Pro v2.3.0
Evalúa las 10 páginas HTML en escritorio (1366x768) y móvil (375x812):
- Inventario de recursos (HTTP 200, imágenes naturalWidth > 0, sin QR expuesto en portada)
- Estilo nativo reseteado de "9 Módulos ▾", z-index: 9999, hover/click/Escape/clic-fuera y acordeón móvil
- Enlaces internos, anclas y subpáginas de los 9 módulos sin 404 ni enlaces muertos
- Botones de descarga (.exe, .deb, .dmg + Gatekeeper) y verificación HTTP 200 real en GitHub Releases
- Checkout de los 5 planes: Copiar al portapapeles, QR Deuna dentro del modal, PayPhone ppls.me,
  plantillas obligatorias WhatsApp/Correo (Deuna y PayPhone) y Soporte Oficial separado
- Campos interactivos (<select>, <input>) sin errores JS ni desbordamiento horizontal (0px)
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
import urllib.parse
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

PORTAL_DIR = Path(__file__).resolve().parent

PAGINAS_PORTAL = [
    "index.html",
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

PAYPHONE_ESPERADOS = {
    "PERSONAL_PRO": "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA",
    "CONTADOR_MASTER": "https://ppls.me/dxope7VBAjK5LR1mO4UitA",
    "ESTUDIO_PRO": "https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg",
    "ENTERPRISE_TEAM": None,
    "ENTERPRISE_CORP": None,
}

PLANES_ESPERADOS = {
    "PERSONAL_PRO": "$59.00",
    "CONTADOR_MASTER": "$139.00",
    "ESTUDIO_PRO": "$299.00",
    "ENTERPRISE_TEAM": "$890.00",
    "ENTERPRISE_CORP": "$1,490.00",
}

RELEASES_REALES = {
    "windows": "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_Enterprise_Windows_x64_Setup.exe",
    "linux": "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_Linux_amd64.deb",
    "macos": "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_macOS.dmg",
}

CSP_ESPERADA = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; base-uri 'self'; form-action 'none';"
)

CAMPOS_OBLIGATORIOS_COMPROBANTE = [
    "[TRIBUTAFLOW PRO] Hola equipo de TributaFlow Pro, envío mi comprobante de pago para activar mi licencia anual v2.3.0:",
    "Plan seleccionado:",
    "Monto USD anual:",
    "Estaciones autorizadas:",
    "Método de pago:",
    "Referencia de orden:",
    "Código HWID PC Principal (TributaFlow Pro -> Activar Licencia):",
    "Datos para emisión de licencia (.lic):",
    "RUC o Cédula:",
    "Nombre / Razón Social:",
    "Correo para recibir tu archivo .lic:",
    "Tu archivo .lic será emitido en breve una vez confirmado el pago.",
]


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        pass


class _ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def iniciar_servidor_local(directorio: Path) -> tuple[_ThreadedTCPServer, int]:
    handler = functools.partial(_QuietHandler, directory=str(directorio))
    server = _ThreadedTCPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def verificar_github_releases() -> dict[str, int]:
    resultados = {}
    for so, url in RELEASES_REALES.items():
        req = urllib.request.Request(
            url,
            method="HEAD",
            headers={"User-Agent": "TributaFlow-Portal-E2E/2.3.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            assert resp.status == 200, f"Release {so} devolvió HTTP {resp.status}: {url}"
            resultados[so] = resp.status
    return resultados


def verificar_plantilla_comprobante(
    texto_decodificado: str,
    plan_monto: str,
    metodo: str,
    ref_prefix: str,
    requiere_extra_hwid: bool = False,
) -> None:
    assert f"{plan_monto} USD / año" in texto_decodificado, f"Falta monto {plan_monto} en: {texto_decodificado}"
    assert metodo in texto_decodificado, f"Falta método {metodo} en: {texto_decodificado}"
    assert ref_prefix in texto_decodificado, f"Falta referencia {ref_prefix} en: {texto_decodificado}"
    if "payphone" in metodo.lower():
        assert "• N.º de Comprobante o Titular de la Tarjeta: [Escribir autorización o titular]" in texto_decodificado, (
            f"Falta campo PayPhone en plantilla: {texto_decodificado}"
        )
    else:
        assert "• N.º de Comprobante / Autorización: [Escribir número de transacción]" in texto_decodificado, (
            f"Falta campo Deuna en plantilla: {texto_decodificado}"
        )
    if requiere_extra_hwid:
        assert "• Código HWID PC(s) Adicional(es): [Pegar códigos HWID adicionales]" in texto_decodificado, (
            f"Falta línea de HWIDs adicionales para plan multiestación: {texto_decodificado}"
        )
    else:
        assert "Código HWID PC(s) Adicional(es):" not in texto_decodificado, (
            f"No debe aparecer línea de HWIDs adicionales en plan de 1 PC: {texto_decodificado}"
        )
    for campo in CAMPOS_OBLIGATORIOS_COMPROBANTE:
        assert campo in texto_decodificado, f"Falta campo obligatorio '{campo}' en plantilla"


def verificar_url_whatsapp_comprobante(
    href: str, monto: str, metodo: str, ref_prefix: str, requiere_extra_hwid: bool = False
) -> None:
    assert href.startswith("https://wa.me/593996459771?text="), f"URL WhatsApp inválida: {href}"
    parsed = urllib.parse.urlparse(href)
    qs = urllib.parse.parse_qs(parsed.query)
    texto = qs.get("text", [""])[0]
    verificar_plantilla_comprobante(texto, monto, metodo, ref_prefix, requiere_extra_hwid=requiere_extra_hwid)


def verificar_url_correo_comprobante(
    href: str, monto: str, metodo: str, ref_prefix: str, requiere_extra_hwid: bool = False
) -> None:
    assert href.startswith("mailto:soporte@tributaflow.com?"), f"URL mailto inválida: {href}"
    parsed = urllib.parse.urlparse(href)
    qs = urllib.parse.parse_qs(parsed.query)
    subject = qs.get("subject", [""])[0]
    body = qs.get("body", [""])[0]
    assert ref_prefix in subject and metodo in subject, f"Asunto correo incompleto: {subject}"
    verificar_plantilla_comprobante(body, monto, metodo, ref_prefix, requiere_extra_hwid=requiere_extra_hwid)


def verificar_soporte_separado(href: str, canal: str) -> None:
    parsed = urllib.parse.urlparse(href)
    qs = urllib.parse.parse_qs(parsed.query)
    if canal == "whatsapp":
        assert href.startswith("https://wa.me/593996459771?text="), f"Soporte WA inválido: {href}"
        texto = qs.get("text", [""])[0]
        assert "Consulta Soporte Técnico — TributaFlow Pro" in texto
        assert "N.º de Comprobante" not in texto
    else:
        assert href.startswith("mailto:soporte@tributaflow.com?"), f"Soporte mailto inválido: {href}"
        subject = qs.get("subject", [""])[0]
        body = qs.get("body", [""])[0]
        assert subject == "Consulta Soporte Técnico — TributaFlow Pro", f"Asunto soporte inesperado: {subject}"
        assert "N.º de Comprobante" not in body


def auditar_enlaces_pagina(page, base_url: str, page_rel: str) -> int:
    links = page.evaluate(
        """() => Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.getAttribute('href') || '',
            text: (a.textContent || '').trim(),
            hasCheckout: a.hasAttribute('data-checkout-plan'),
            hasDownloadOs: a.hasAttribute('data-download-os'),
        }))"""
    )
    checked = 0
    for item in links:
        href = item["href"]
        assert href != "", f"{page_rel}: enlace vacío sin href ({item['text']})"
        if href == "#":
            raise AssertionError(f"{page_rel}: enlace muerto href='#' ({item['text']})")
        if href.startswith(("mailto:", "https://wa.me/", "https://ppls.me/", "https://github.com/")):
            checked += 1
            continue
        if href.startswith("http://") or href.startswith("https://"):
            checked += 1
            continue
        # Enlace interno relativo o ancla
        resolved = urllib.parse.urljoin(f"{base_url}/{page_rel}", href)
        parsed = urllib.parse.urlparse(resolved)
        target_path = parsed.path.lstrip("/")
        if target_path:
            full_target = PORTAL_DIR / target_path
            assert full_target.is_file(), f"{page_rel}: destino interno no existe: {href} -> {full_target}"
            if parsed.fragment:
                html_target = full_target.read_text(encoding="utf-8")
                assert f'id="{parsed.fragment}"' in html_target or f"id='{parsed.fragment}'" in html_target, (
                    f"{page_rel}: ancla #{parsed.fragment} no existe en {target_path}"
                )
        elif parsed.fragment:
            exists = page.evaluate("(id) => Boolean(document.getElementById(id))", parsed.fragment)
            assert exists, f"{page_rel}: ancla #{parsed.fragment} ausente en DOM"
        checked += 1
    return checked


def auditar_pagina_viewport(browser, base_url: str, page_rel: str, viewport: dict, es_movil: bool) -> dict:
    context = browser.new_context(
        viewport=viewport,
        permissions=["clipboard-read", "clipboard-write"],
    )
    context.add_init_script(
        """
        window.__tfCspViolations = [];
        document.addEventListener('securitypolicyviolation', (e) => {
            window.__tfCspViolations.push({
                directive: e.violatedDirective,
                blockedURI: e.blockedURI,
            });
        });
        """
    )
    page = context.new_page()

    console_errors: list[str] = []
    page_errors: list[str] = []
    bad_local_responses: list[str] = []

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: page_errors.append(str(err)))
    page.on(
        "response",
        lambda res: bad_local_responses.append(f"{res.status} {res.url}")
        if res.url.startswith(base_url) and res.status >= 400
        else None,
    )

    # Evitar descargas reales de binarios externos al probar clics de botones de descarga
    page.route(
        re.compile(r"https://github\.com/.*/releases/download/.*"),
        lambda route: route.abort(),
    )

    url = f"{base_url}/{page_rel}"
    resp = page.goto(url, wait_until="domcontentloaded")
    assert resp is not None and resp.status == 200, f"Fallo al cargar {url}: {resp.status if resp else 'None'}"
    page.wait_for_timeout(250)

    # 1. Desbordamiento horizontal = 0px
    overflow = page.evaluate(
        "() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })"
    )
    assert overflow["scrollW"] <= overflow["innerW"], (
        f"{page_rel} ({viewport['width']}px): desbordamiento horizontal {overflow['scrollW']} > {overflow['innerW']}"
    )

    # 2. Inventario de imágenes y favicon (naturalWidth > 0)
    imgs = page.evaluate(
        """() => Array.from(document.querySelectorAll('img')).map(img => ({
            id: img.id || '',
            src: img.getAttribute('src') || '',
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            insideModal: Boolean(img.closest('#modalPago')),
            visible: img.offsetParent !== null,
        }))"""
    )
    for img in imgs:
        assert img["complete"] and img["naturalWidth"] > 0, (
            f"{page_rel}: imagen rota src={img['src']} (complete={img['complete']}, w={img['naturalWidth']})"
        )
        if "qr-deuna" in img["src"]:
            assert img["insideModal"], f"{page_rel}: QR Deuna expuesto fuera de #modalPago"
            assert not img["visible"], f"{page_rel}: QR Deuna visible antes de abrir #modalPago"

    # Favicon HTTP 200
    fav_href = page.evaluate("() => document.querySelector('link[rel=\"icon\"]')?.getAttribute('href') || ''")
    assert fav_href, f"{page_rel}: falta link rel=icon"
    fav_url = urllib.parse.urljoin(url, fav_href)
    with urllib.request.urlopen(fav_url, timeout=5) as r_fav:
        assert r_fav.status == 200

    # 3. Botón flotante + Soporte en footer activo y visible
    btn_float = page.locator("#btnFlotanteSoporte")
    assert btn_float.is_visible(), f"{page_rel}: #btnFlotanteSoporte no visible"
    verificar_soporte_separado(btn_float.get_attribute("href") or "", "whatsapp")

    footer_support_links = page.evaluate(
        """() => Array.from(document.querySelectorAll('footer a')).map(a => ({
            href: a.getAttribute('href') || '',
            text: (a.textContent || '').trim(),
            visible: a.offsetParent !== null,
        }))"""
    )
    assert any("593996459771" in l["href"] and l["visible"] for l in footer_support_links), (
        f"{page_rel}: falta enlace WhatsApp visible en footer"
    )
    assert any("mailto:soporte@tributaflow.com" in l["href"] and l["visible"] for l in footer_support_links), (
        f"{page_rel}: falta enlace mailto:soporte@tributaflow.com visible en footer"
    )

    # 4. Dropdown "9 Módulos ▾" — Estilo y Funcionalidad
    trigger = page.locator(".nav-dropdown-trigger")
    panel = page.locator(".nav-dropdown-panel")
    assert trigger.count() == 1 and panel.count() == 1, f"{page_rel}: dropdown ausente"

    dropdown_items = panel.locator("a.nav-dropdown-item")
    assert dropdown_items.count() == 9, f"{page_rel}: se esperaban 9 módulos en dropdown, hay {dropdown_items.count()}"

    if not es_movil:
        # Verificar z-index: 9999 y estilos reseteados idénticos a los links vecinos
        styles = page.evaluate(
            """() => {
                const btn = document.querySelector('.nav-dropdown-trigger');
                const ref = document.querySelector('#navMenu > a:not(.nav-cta)');
                const panel = document.querySelector('.nav-dropdown-panel');
                const grid = document.querySelector('.nav-dropdown-grid');
                const bs = getComputedStyle(btn);
                const rs = getComputedStyle(ref);
                const ps = getComputedStyle(panel);
                const gs = getComputedStyle(grid);
                return {
                    btnBg: bs.backgroundColor,
                    btnBorder: bs.borderTopWidth,
                    btnFontSize: bs.fontSize,
                    btnFontFamily: bs.fontFamily,
                    btnPadding: bs.padding,
                    btnCursor: bs.cursor,
                    btnDisplay: bs.display,
                    refFontSize: rs.fontSize,
                    refFontFamily: rs.fontFamily,
                    refPadding: rs.padding,
                    panelZIndex: ps.zIndex,
                    gridCols: gs.gridTemplateColumns,
                    btnColor: bs.color,
                    refColor: rs.color,
                };
            }"""
        )
        assert styles["btnBg"] == "rgba(0, 0, 0, 0)", f"{page_rel}: botón dropdown no transparente: {styles['btnBg']}"
        assert styles["btnBorder"] == "0px", f"{page_rel}: botón dropdown con borde: {styles['btnBorder']}"
        assert styles["btnFontSize"] == styles["refFontSize"], f"{page_rel}: fontSize distinto"
        assert styles["btnFontFamily"] == styles["refFontFamily"], f"{page_rel}: fontFamily distinto"
        assert styles["btnPadding"] == styles["refPadding"], f"{page_rel}: padding distinto"
        assert styles["btnCursor"] == "pointer"
        assert styles["panelZIndex"] == "9999", f"{page_rel}: z-index esperado 9999, obtuvo {styles['panelZIndex']}"
        assert len(styles["gridCols"].split()) == 2, f"{page_rel}: grid debe tener 2 columnas: {styles['gridCols']}"
        if page_rel == "index.html":
            assert styles["btnColor"] == "rgb(148, 163, 184)", f"Color esperado #94A3B8, obtuvo {styles['btnColor']}"
            assert styles["btnColor"] == styles["refColor"]

        # Hover abre y mouseleave cierra
        trigger.hover()
        page.wait_for_timeout(120)
        assert panel.is_visible(), f"{page_rel}: dropdown no abrió con hover"
        page.mouse.move(15, 500)
        page.wait_for_timeout(380)
        assert not panel.is_visible(), f"{page_rel}: dropdown no cerró al quitar hover"

        # Clic abre, Escape cierra
        trigger.click()
        page.wait_for_timeout(120)
        assert panel.is_visible(), f"{page_rel}: dropdown no abrió con clic"
        page.keyboard.press("Escape")
        page.wait_for_timeout(240)
        assert not panel.is_visible(), f"{page_rel}: dropdown no cerró con Escape"

        # Clic abre, clic fuera cierra
        trigger.click()
        page.wait_for_timeout(120)
        assert panel.is_visible()
        page.mouse.click(20, 500)
        page.wait_for_timeout(240)
        assert not panel.is_visible(), f"{page_rel}: dropdown no cerró con clic exterior"
    else:
        # Móvil: abrir menú hamburguesa y probar acordeón
        nav_toggle = page.locator("#navToggle")
        assert nav_toggle.is_visible(), f"{page_rel}: #navToggle no visible en móvil"
        nav_toggle.click()
        page.wait_for_timeout(150)
        assert page.locator("#navMenu").is_visible(), f"{page_rel}: #navMenu móvil no abrió"
        trigger.click()
        page.wait_for_timeout(150)
        assert panel.is_visible(), f"{page_rel}: acordeón móvil 9 Módulos no abrió"
        cols_movil = page.evaluate("() => getComputedStyle(document.querySelector('.nav-dropdown-grid')).gridTemplateColumns")
        assert len(cols_movil.split()) == 1, f"{page_rel}: acordeón móvil debe tener 1 columna: {cols_movil}"
        trigger.click()
        page.wait_for_timeout(120)
        assert not panel.is_visible(), f"{page_rel}: acordeón móvil no colapsó al tocar de nuevo"
        page.keyboard.press("Escape")
        page.wait_for_timeout(120)

    # 5. Enlaces internos y anclas
    enlaces_verificados = auditar_enlaces_pagina(page, base_url, page_rel)

    # 6. Pruebas específicas de index.html (Portada Protegida, Descargas, 5 Planes, Formularios/Inputs, Soporte)
    planes_probados = 0
    inputs_probados = 0
    if page_rel == "index.html" and not es_movil:
        # Verificar tarjeta pública protegida Deuna (sin QR directo escaneable)
        texto_body = page.locator("body").inner_text()
        assert "Pago Local Instantáneo con Deuna! (0 % Comisión)" in texto_body
        assert "Fausto Andrés Orellana Jaén" in texto_body
        btn_qr_portada = page.locator("#btnSeleccionarPlanQr")
        assert btn_qr_portada.is_visible()
        assert "Seleccionar Plan para Generar QR y Referencia" in btn_qr_portada.inner_text()
        btn_qr_portada.click()
        page.wait_for_timeout(250)

        # Modales de descarga (Windows, Linux, macOS + Gatekeeper)
        for so, modal_id in (
            ("windows", "#modalDescargaWindows"),
            ("linux", "#modalDescargaLinux"),
            ("macos", "#modalDescargaMacos"),
        ):
            btn_dl = page.locator(f'a[data-download-os="{so}"]')
            assert btn_dl.get_attribute("href") == RELEASES_REALES[so]
            btn_dl.click()
            page.wait_for_timeout(120)
            modal_dl = page.locator(modal_id)
            assert modal_dl.is_visible(), f"No abrió {modal_id}"
            if so == "macos":
                assert "Control + clic" in modal_dl.inner_text()
            modal_dl.locator(".btn-close").click()
            page.wait_for_timeout(100)
            assert not modal_dl.is_visible()

        # Probar los 5 planes en #modalPago
        for plan_id, monto_esperado in PLANES_ESPERADOS.items():
            btn_plan = page.locator(f'[data-checkout-plan="{plan_id}"]').first
            btn_plan.scroll_into_view_if_needed()
            btn_plan.click()
            page.wait_for_timeout(150)

            modal_pago = page.locator("#modalPago")
            assert modal_pago.is_visible(), f"No abrió #modalPago para {plan_id}"
            assert monto_esperado in page.locator("#pagoMontoTotal").inner_text()

            # QR Deuna SÍ se muestra dentro del modal
            qr_modal = page.locator("#pagoQrDeunaImg")
            assert qr_modal.is_visible(), f"QR Deuna no visible dentro del modal para {plan_id}"
            qr_w = qr_modal.evaluate("el => el.naturalWidth")
            assert qr_w > 0, f"QR Deuna dentro del modal sin naturalWidth: {qr_w}"

            # Probar botones Copiar
            page.locator("#modalPago .ref-banner .btn-copy-mini").click()
            page.wait_for_timeout(100)
            assert page.locator("#tfCopyToast").is_visible(), "No apareció toast al copiar referencia"

            # Probar campos interactivos dentro del modal (select, hwid input, extra seats)
            in_hwid = page.locator("#pagoHwidInput")
            assert in_hwid.get_attribute("type") == "text" and in_hwid.get_attribute("placeholder")
            in_hwid.fill("TF-ABCD-1234")
            inputs_probados += 1
            ref_actual = page.locator("#pagoReferenciaTexto").inner_text()
            assert ref_actual == f"TF-{plan_id}-TFABCD12", f"Referencia inesperada: {ref_actual}"

            # Deuna! WhatsApp + Correo + Soporte Oficial
            requiere_extra_hwid = plan_id in ("ESTUDIO_PRO", "ENTERPRISE_TEAM", "ENTERPRISE_CORP")
            verificar_url_whatsapp_comprobante(
                page.locator("#btnEnviarComprobanteWp").get_attribute("href") or "",
                monto_esperado,
                "Deuna! / Banco Pichincha",
                f"TF-{plan_id}-",
                requiere_extra_hwid=requiere_extra_hwid,
            )
            verificar_url_correo_comprobante(
                page.locator("#btnEnviarComprobanteCorreo").get_attribute("href") or "",
                monto_esperado,
                "Deuna! / Banco Pichincha",
                f"TF-{plan_id}-",
                requiere_extra_hwid=requiere_extra_hwid,
            )
            verificar_soporte_separado(page.locator("#btnSoporteDeunaWp").get_attribute("href") or "", "whatsapp")
            verificar_soporte_separado(page.locator("#btnSoporteDeunaCorreo").get_attribute("href") or "", "correo")

            # PayPhone vs Enterprise
            url_pp_esperada = PAYPHONE_ESPERADOS[plan_id]
            if url_pp_esperada:
                assert page.locator("#pagoPayphonePanel").is_visible()
                assert not page.locator("#pagoEnterpriseLanPanel").is_visible()
                assert page.locator("#btnPagarPayphoneModal").get_attribute("href") == url_pp_esperada
                paso2_txt = page.locator("#pagoPayphonePaso2").inner_text()
                assert "Paso 2" in paso2_txt and "titular de la tarjeta" in paso2_txt.lower()
                assert "falsos positivos" not in paso2_txt.lower()
                verificar_url_whatsapp_comprobante(
                    page.locator("#btnPayphoneVoucherWp").get_attribute("href") or "",
                    monto_esperado,
                    "PayPhone Tarjeta",
                    f"TF-{plan_id}-",
                    requiere_extra_hwid=requiere_extra_hwid,
                )
                verificar_url_correo_comprobante(
                    page.locator("#btnPayphoneVoucherCorreo").get_attribute("href") or "",
                    monto_esperado,
                    "PayPhone Tarjeta",
                    f"TF-{plan_id}-",
                    requiere_extra_hwid=requiere_extra_hwid,
                )
                verificar_soporte_separado(
                    page.locator("#btnSoportePayphoneWp").get_attribute("href") or "", "whatsapp"
                )
                verificar_soporte_separado(
                    page.locator("#btnSoportePayphoneCorreo").get_attribute("href") or "", "correo"
                )
            else:
                assert not page.locator("#pagoPayphonePanel").is_visible()
                assert page.locator("#pagoEnterpriseLanPanel").is_visible()
                verificar_soporte_separado(
                    page.locator("#btnSoporteEnterpriseWp").get_attribute("href") or "", "whatsapp"
                )
                verificar_soporte_separado(
                    page.locator("#btnSoporteEnterpriseCorreo").get_attribute("href") or "", "correo"
                )
                if plan_id == "ENTERPRISE_CORP":
                    page.locator("#pagoExtraSeatsBar button", has_text="+").click()
                    page.wait_for_timeout(80)
                    assert "$1,640.00" in page.locator("#pagoMontoTotal").inner_text()
                    page.locator("#pagoExtraSeatsInput").fill("2")
                    inputs_probados += 1
                    assert "$1,790.00" in page.locator("#pagoMontoTotal").inner_text()
                    assert "12 PCs totales" in page.locator("#pagoEstacionesTotales").inner_text()
                    page.locator("#pagoExtraSeatsInput").fill("0")

            # Verificar cambio por <select>
            if plan_id == "PERSONAL_PRO":
                page.locator("#pagoPlanSelect").select_option("ESTUDIO_PRO")
                inputs_probados += 1
                assert "$299.00" in page.locator("#pagoMontoTotal").inner_text()
                page.locator("#pagoPlanSelect").select_option("PERSONAL_PRO")

            # Probar copia al portapapeles al pulsar botón Correo
            page.locator("#btnEnviarComprobanteCorreo").evaluate("el => el.addEventListener('click', e => e.preventDefault(), {once: true})")
            page.locator("#btnEnviarComprobanteCorreo").click()
            page.wait_for_timeout(100)
            clip_txt = page.evaluate("() => navigator.clipboard.readText()")
            assert "soporte@tributaflow.com" in clip_txt and "N.º de Comprobante" in clip_txt

            modal_pago.locator(".btn-close").click()
            page.wait_for_timeout(100)
            assert not modal_pago.is_visible()
            planes_probados += 1

        # Probar modales legales del footer
        for legal_key in ("terminos", "privacidad", "licenciamiento"):
            page.locator(f'button[data-legal="{legal_key}"]').click()
            page.wait_for_timeout(80)
            assert page.locator("#modalLegal").is_visible()
            page.keyboard.press("Escape")
            page.wait_for_timeout(80)
            assert not page.locator("#modalLegal").is_visible()

        # Probar inmutabilidad Object.freeze y guardian anti-redireccion ante manipulacion DOM
        freeze_audit = page.evaluate(
            """() => {
                "use strict";
                const sec = window.__TF_SECURITY__;
                if (!sec) return { ok: false, err: "missing __TF_SECURITY__" };
                const frozenAll =
                    Object.isFrozen(sec) &&
                    Object.isFrozen(sec.CONFIG_COMERCIAL) &&
                    Object.isFrozen(sec.CONFIG_COMERCIAL.PAYPHONE_LINKS) &&
                    Object.isFrozen(sec.PLANES_V230);
                let threw = false;
                try {
                    sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.PERSONAL_PRO = "https://evil.test/steal";
                } catch (err) {
                    threw = err instanceof TypeError;
                }
                const unchanged =
                    sec.CONFIG_COMERCIAL.PAYPHONE_LINKS.PERSONAL_PRO === "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA" &&
                    sec.CONFIG_COMERCIAL.WHATSAPP_NUMERO === "593996459771" &&
                    sec.CONFIG_COMERCIAL.CORREO_SOPORTE === "soporte@tributaflow.com";
                const validChecks =
                    sec.validarDestinoSeguro("https://ppls.me/5S1Y89pBi1vYHBTEgEzRA", "payphone") &&
                    sec.validarDestinoSeguro("https://wa.me/593996459771?text=Hola", "whatsapp") &&
                    sec.validarDestinoSeguro("mailto:soporte@tributaflow.com?subject=Test", "correo");
                const blockedChecks =
                    !sec.validarDestinoSeguro("https://evil.test/pay", "payphone") &&
                    !sec.validarDestinoSeguro("https://ppls.me/FakeId123", "payphone") &&
                    !sec.validarDestinoSeguro("https://wa.me/593996459771999?text=Phish", "whatsapp") &&
                    !sec.validarDestinoSeguro("https://wa.me/593000000000", "whatsapp") &&
                    !sec.validarDestinoSeguro("mailto:atacante@evil.com", "correo") &&
                    !sec.validarDestinoSeguro("mailto:soporte@tributaflow.com.evil.org", "correo");
                return { ok: frozenAll && threw && unchanged && validChecks && blockedChecks, frozenAll, threw, unchanged, validChecks, blockedChecks };
            }"""
        )
        assert freeze_audit.get("ok"), f"{page_rel}: fallo verificacion Object.freeze / allowlist: {freeze_audit}"

        # Manipulacion DOM real en enlace PayPhone y WhatsApp: el guardian debe bloquear la navegacion
        page.locator('[data-checkout-plan="PERSONAL_PRO"]').first.click()
        page.wait_for_timeout(120)
        popups_abiertos = []
        context.on("page", lambda p: popups_abiertos.append(p.url))
        url_antes = page.url
        for sel, fake_url in (
            ("#btnPagarPayphoneModal", "https://evil-redirect.test/phish-payphone"),
            ("#btnEnviarComprobanteWp", "https://wa.me/593000000000?text=fake"),
        ):
            page.evaluate(
                """([s, u]) => {
                    window.__TF_LAST_BLOCKED_URL__ = null;
                    const el = document.querySelector(s);
                    el.setAttribute("href", u);
                }""",
                [sel, fake_url],
            )
            page.locator(sel).click()
            page.wait_for_timeout(80)
            assert page.evaluate("() => window.__TF_LAST_BLOCKED_URL__") == fake_url, (
                f"El guardian no intercepto click manipulado en {sel}"
            )
            assert "bloqueado" in page.locator("#tfCopyToast").inner_text().lower()
        assert page.url == url_antes and not popups_abiertos, (
            f"Se abrio popup o navego ante URL manipulada: {popups_abiertos}"
        )
        page.locator("#modalPago .btn-close").click()
        page.wait_for_timeout(80)

    # 6B. Cabeceras de seguridad HTML (CSP exacta, referrer no-referrer y rel=noopener noreferrer)
    sec_meta = page.evaluate(
        """() => {
            const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") || "";
            const ref = document.querySelector('meta[name="referrer"]')?.getAttribute("content") || "";
            const badBlanks = Array.from(document.querySelectorAll('a[target="_blank"]'))
                .filter(a => {
                    const rel = (a.getAttribute("rel") || "").toLowerCase().split(/\\s+/);
                    return !(rel.includes("noopener") && rel.includes("noreferrer"));
                })
                .map(a => a.outerHTML);
            return { csp, ref, badBlanks };
        }"""
    )
    assert sec_meta["csp"] == CSP_ESPERADA, f"{page_rel}: CSP no coincide:\n  actual: {sec_meta['csp']}\n  espera: {CSP_ESPERADA}"
    assert sec_meta["ref"] == "no-referrer", f"{page_rel}: meta referrer inesperado: {sec_meta['ref']}"
    assert not sec_meta["badBlanks"], f"{page_rel}: enlaces target=_blank sin rel=noopener noreferrer: {sec_meta['badBlanks']}"

    # 6C. Verificar cero atributos inline on* y, en portada, secciones #quienes-somos y #politicas
    inline_handlers = page.evaluate(
        """() => {
            const bad = [];
            for (const el of document.querySelectorAll("*")) {
                for (const attr of el.attributes) {
                    if (attr.name.toLowerCase().startsWith("on")) {
                        bad.push(`${el.tagName.toLowerCase()}[${attr.name}]`);
                    }
                }
            }
            return bad;
        }"""
    )
    assert not inline_handlers, f"{page_rel}: atributos inline prohibidos por CSP: {inline_handlers}"

    if page_rel == "index.html":
        assert page.locator('#navMenu a[href="#quienes-somos"]').count() == 1
        assert page.locator('#navMenu a[href="#politicas"]').count() == 1
        assert page.locator('footer a[href="#quienes-somos"]').count() == 1
        assert page.locator('footer a[href="#politicas"]').count() == 1
        sec_qs = page.locator("#quienes-somos")
        assert sec_qs.is_visible()
        assert "Ingeniería Ecuatoriana Especializada en Automatización y Seguridad Tributaria" in sec_qs.inner_text()
        assert sec_qs.locator(".trust-pillar-card").count() == 3

        sec_pol = page.locator("#politicas")
        assert sec_pol.is_visible()
        accordions = sec_pol.locator("details.policy-accordion")
        assert accordions.count() == 4
        for idx in range(accordions.count()):
            det = accordions.nth(idx)
            det.locator("summary").scroll_into_view_if_needed()
            det.locator("summary").click()
            page.wait_for_timeout(40)
            assert det.get_attribute("open") is not None, f"Acordeon {idx + 1} no se desplego"
            ov_acc = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            assert ov_acc <= 0, f"{page_rel}: overflow {ov_acc}px al abrir acordeon {idx + 1}"
            det.locator("summary").click()
            page.wait_for_timeout(40)
            assert det.get_attribute("open") is None, f"Acordeon {idx + 1} no se cerro"

    # 7. Inventario genérico de <form>, <input>, <select>, <textarea> en la página
    campos_dom = page.evaluate(
        """() => Array.from(document.querySelectorAll('form, input, select, textarea')).map(el => ({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            type: el.getAttribute('type') || '',
            hasLabel: el.id ? Boolean(document.querySelector(`label[for="${el.id}"]`)) : false,
            hasPlaceholder: Boolean(el.getAttribute('placeholder')),
        }))"""
    )
    for c in campos_dom:
        if c["tag"] == "input" and c["id"] == "pagoHwidInput":
            assert c["hasLabel"] and c["hasPlaceholder"]
        if c["tag"] == "select" and c["id"] == "pagoPlanSelect":
            assert c["hasLabel"]

    csp_violations = page.evaluate("() => window.__tfCspViolations || []")
    assert not csp_violations, f"{page_rel}: violaciones CSP detectadas: {csp_violations}"
    assert not console_errors, f"{page_rel}: errores de consola JS: {console_errors}"
    assert not page_errors, f"{page_rel}: excepciones JS no capturadas: {page_errors}"
    assert not bad_local_responses, f"{page_rel}: recursos con error HTTP: {bad_local_responses}"

    context.close()
    return {
        "pagina": page_rel,
        "viewport": f"{viewport['width']}x{viewport['height']}",
        "overflow_px": max(0, overflow["scrollW"] - overflow["innerW"]),
        "imagenes_ok": len(imgs),
        "enlaces_ok": enlaces_verificados,
        "planes_probados": planes_probados,
        "inputs_probados": inputs_probados,
        "campos_detectados": len(campos_dom),
        "errores": 0,
    }


def main() -> None:
    t0 = time.monotonic()
    print("=== [1/3] Verificando URLs reales de GitHub Releases v2.3.0 ===")
    releases_status = verificar_github_releases()
    print(f"[OK] Releases HTTP 200 verificados: {releases_status}")

    server, port = iniciar_servidor_local(PORTAL_DIR)
    base_url = f"http://127.0.0.1:{port}"
    reportes = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                print(f"\n=== [2/3] Auditando 10 páginas en Escritorio (1366x768) sobre {base_url} ===")
                for pagina in PAGINAS_PORTAL:
                    rep = auditar_pagina_viewport(
                        browser, base_url, pagina, {"width": 1366, "height": 768}, es_movil=False
                    )
                    reportes.append(rep)
                    print(f"  [PASS] 1366x768 | {pagina} | imgs={rep['imagenes_ok']} links={rep['enlaces_ok']} planes={rep['planes_probados']}")

                print(f"\n=== [3/3] Auditando 10 páginas en Móvil (375x812) sobre {base_url} ===")
                for pagina in PAGINAS_PORTAL:
                    rep = auditar_pagina_viewport(
                        browser, base_url, pagina, {"width": 375, "height": 812}, es_movil=True
                    )
                    reportes.append(rep)
                    print(f"  [PASS]  375x812 | {pagina} | imgs={rep['imagenes_ok']} links={rep['enlaces_ok']}")
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()

    elapsed = time.monotonic() - t0
    print("\n" + "=" * 78)
    print(f"AUDITORÍA E2E PORTAL WEB: 100% PASS ({len(reportes)} ejecuciones, 0 errores) en {elapsed:.2f}s")
    print("=" * 78)
    print(json.dumps({"releases_http_200": releases_status, "runs": len(reportes)}, indent=2))


if __name__ == "__main__":
    main()
