document.addEventListener("DOMContentLoaded", () => {
    // 1. Extraer los parámetros pasados por el software (ej: ?device_id=TF-F2158D-...)
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('device_id');
    const rucParam = urlParams.get('ruc');

    if (deviceId) {
        const hwidField = document.getElementById('hwidInput');
        hwidField.value = deviceId;
        
        // Desplazar automáticamente a la sección de activación
        setTimeout(() => {
            document.getElementById('activacion').scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }

    if (rucParam) {
        document.getElementById('clienteRUC').value = rucParam;
    }
});

function seleccionarPlan(nombrePlan, precio) {
    document.getElementById('planSeleccionado').value = `${nombrePlan} ($${precio} USD)`;
    document.getElementById('activacion').scrollIntoView({ behavior: 'smooth' });
}

function procesarSolicitud(e) {
    e.preventDefault();
    document.getElementById('formLicencia').style.display = 'none';
    document.getElementById('resultadoProceso').style.display = 'block';
}