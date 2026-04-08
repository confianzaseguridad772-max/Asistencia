// Variables globales
let integrantes = [];
const urlApp = "https://script.google.com/macros/s/AKfycbyECTPo-gSKXIoIKa1PNT5PidN4kiNkumpvDjH7a9EFi0uG7w1rliYxn3H5FW9bfu7n-A/exec"; // Reemplaza con tu URL real

// 1. CONFIGURACIÓN INICIAL
window.onload = function() {
    const fechaInput = document.getElementById('fechaManual');
    const fechaDisplay = document.getElementById('fechaDisplay');
    const hoy = new Date();
    
    // Ajuste de fecha local para el input YYYY-MM-DD
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
    if(fechaInput) fechaInput.value = fechaLocal.toISOString().split('T')[0];
    
    // Mostrar fecha en formato legible DD/MM/YYYY
    if(fechaDisplay) fechaDisplay.innerText = hoy.toLocaleDateString('es-PE');

    // Escuchar cambios en el motivo para ajustar la interfaz en tiempo real
    const motivoSelect = document.getElementById('motivoReunion');
    if(motivoSelect) {
        motivoSelect.addEventListener('change', gestionarVisibilidad);
        gestionarVisibilidad(); 
    }
};

// 2. BUSQUEDA POR LÍDER Y CRUCE DE DONES
async function buscarPorLider() {
    const lider = document.getElementById('selectLider').value;
    if (!lider) return;

    const loading = document.getElementById('loading');
    if(loading) loading.style.display = 'block';

    try {
        const resp = await fetch(`${urlApp}?lider=${encodeURIComponent(lider)}`);
        integrantes = await resp.json();
        
        renderizarTablas();
        gestionarVisibilidad(); 
        
    } catch (err) {
        console.error("Error:", err);
        alert("Error al conectar con el servidor.");
    } finally {
        if(loading) loading.style.display = 'none';
    }
}

// 3. CONTROL DINÁMICO DE INTERFAZ (Observación 2 integrada)
function gestionarVisibilidad() {
    const motivo = document.getElementById('motivoReunion').value;
    const secBautizados = document.getElementById('seccionBautizados');
    const secAmigos = document.getElementById('seccionAmigos');
    const inputsLeccion = document.querySelectorAll('.lec-input');

    if (!secBautizados || !secAmigos) return;

    if (motivo === "GP:Estudios biblicos") {
        // REGLA: En Estudios Bíblicos NO se pide información de Bautizados
        secBautizados.setAttribute('style', 'display: none !important');
        secAmigos.setAttribute('style', 'display: block !important');
        inputsLeccion.forEach(input => input.style.display = 'block');
    } 
    else if (motivo === "GP:Hogares") {
        // Mostrar ambos módulos pero OCULTAR el número de lección (Solo asistencia SI/NO)
        secBautizados.setAttribute('style', 'display: block !important');
        secAmigos.setAttribute('style', 'display: block !important');
        inputsLeccion.forEach(input => input.style.display = 'none');
    }
    else if (motivo === "GP:Unidad de Acción") {
        // Mostrar ambos módulos y permitir ingreso de número de lección
        secBautizados.setAttribute('style', 'display: block !important');
        secAmigos.setAttribute('style', 'display: block !important');
        inputsLeccion.forEach(input => input.style.display = 'block');
    }
}

// 4. RENDERIZADO DE TABLAS
function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    if (!tbB || !tbA) return;
    
    tbB.innerHTML = ''; 
    tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        const nombre = p.Nombres || p.NOMBRES || "Sin Nombre";
        const tipo = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const esBautizado = tipo.includes("bautizado");
        const tieneDones = p.TieneDones || "NO";
        const colorDones = tieneDones === "SI" ? "#1e8e3e" : "#d93025";

        const rowHtml = `
            <tr>
                <td>
                    <div style="font-weight: 600;">${nombre}</div>
                    <small style="color: ${colorDones}; font-weight: 800;">¿REGISTRO DONES?: ${tieneDones}</small>
                </td>
                <td align="right">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <input type="number" id="lec-${i}" class="lec-input" placeholder="N°" min="1" style="width: 50px; text-align: center;">
                        <input type="checkbox" class="check-asis" data-idx="${i}" style="width: 20px; height: 20px;">
                    </div>
                </td>
            </tr>`;
        
        if (esBautizado) tbB.innerHTML += rowHtml;
        else tbA.innerHTML += rowHtml;
    });
}

// 5. ENVÍO DE ASISTENCIA CON FILTROS (Observación 1 y 2 integradas)
async function enviarAsistencia() {
    const checks = document.querySelectorAll('.check-asis:checked');
    if (checks.length === 0) return alert("Seleccione al menos una persona.");

    const btn = document.getElementById('btnEnviar');
    const motivo = document.getElementById('motivoReunion').value;
    const todosLosRegistros = [];
    
    const fechaVal = document.getElementById('fechaManual').value;
    const liderVal = document.getElementById('selectLider').value;
    const grupoVal = document.getElementById('nombreGrupo').value;

    for (let check of checks) {
        const idx = check.getAttribute('data-idx');
        const persona = integrantes[idx];
        const tipoPersona = (persona.Tipo || persona.TIPO || "").toString().toLowerCase();
        const inputLec = document.getElementById(`lec-${idx}`);
        const numLec = inputLec.value;

        // OBSERVACIÓN: Si es Estudios Bíblicos, ignorar a los Bautizados aunque estén marcados
        if (motivo === "GP:Estudios biblicos" && tipoPersona.includes("bautizado")) {
            continue; 
        }

        // VALIDACIÓN: En Estudios Bíblicos la lección para Amigos es obligatoria
        if (motivo === "GP:Estudios biblicos" && !numLec) {
            alert(`Por favor, ingrese el número de lección para el amigo: ${persona.Nombres || persona.NOMBRES}`);
            inputLec.focus();
            return;
        }

        todosLosRegistros.push({
            nombre: (persona.Nombres || persona.NOMBRES),
            leccionNum: numLec || "1", // Valor por defecto si no es visible
            fecha: fechaVal,
            lider: liderVal,
            grupo: grupoVal,
            tipo: (persona.Tipo || persona.TIPO || "")
        });
    }

    if (todosLosRegistros.length === 0 && motivo === "GP:Estudios biblicos") {
        return alert("Para Estudios Bíblicos debe registrar al menos un Amigo de Esperanza.");
    }

    const payload = {
        destino: "ASISTENCIA",
        reporteAsist: {
            lider: liderVal,
            fecha: fechaVal,
            grupo: grupoVal,
            motivo: motivo,
            les: document.getElementById('totalLes').value || 0,
            ofr: document.getElementById('totalOfrendas').value || 0,
            nB: document.getElementById('numBautismo').value || 0
        },
        registros: todosLosRegistros
    };

    try {
        btn.disabled = true;
        btn.innerText = "🚀 Guardando...";
        
        // El envío se hace a la URL del Apps Script que ahora maneja la migración a Amigos/Hogares/Unidad
        await fetch(urlApp, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        
        document.getElementById('modalResumen').style.display = 'flex';
        
    } catch (err) {
        alert("Error al enviar el reporte.");
        btn.disabled = false;
        btn.innerText = "Guardar Reporte General";
    }
}
