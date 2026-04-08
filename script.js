// Variables globales
let integrantes = [];
const urlApp = "https://script.google.com/macros/s/AKfycbzFBPVkD-qnmzk_B5VK7GnfZDWHyymyBrx60Bz3La147ZqeOZ1nVx-Suin8q3FiaAqJqA/exec";

// 1. CONFIGURACIÓN INICIAL
window.onload = function() {
    const fechaInput = document.getElementById('fechaManual');
    const fechaDisplay = document.getElementById('fechaDisplay');
    const hoy = new Date();
    
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
    if(fechaInput) fechaInput.value = fechaLocal.toISOString().split('T')[0];
    
    if(fechaDisplay) fechaDisplay.innerText = hoy.toLocaleDateString('es-PE');

    const motivoSelect = document.getElementById('motivoReunion');
    if(motivoSelect) {
        motivoSelect.addEventListener('change', gestionarVisibilidad);
        gestionarVisibilidad(); 
    }
};

// 2. BUSQUEDA POR LÍDER
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

// 3. VISIBILIDAD
function gestionarVisibilidad() {
    const motivo = document.getElementById('motivoReunion').value;
    const secBautizados = document.getElementById('seccionBautizados');
    const secAmigos = document.getElementById('seccionAmigos');
    const inputsLeccion = document.querySelectorAll('.lec-input');

    if (!secBautizados || !secAmigos) return;

    if (motivo === "GP:Estudios biblicos") {
        secBautizados.style.display = 'none';
        secAmigos.style.display = 'block';
        inputsLeccion.forEach(input => input.style.display = 'block');
    } 
    else if (motivo === "GP:Hogares") {
        secBautizados.style.display = 'block';
        secAmigos.style.display = 'block';
        inputsLeccion.forEach(input => input.style.display = 'none');
    }
    else {
        secBautizados.style.display = 'block';
        secAmigos.style.display = 'block';
        inputsLeccion.forEach(input => input.style.display = 'block');
    }
}

// 4. RENDER
function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    
    tbB.innerHTML = ''; 
    tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        const nombre = p.Nombres || "Sin Nombre";
        const dni = p.DNI || "";
        const tipo = (p.Tipo || "").toLowerCase();

        const rowHtml = `
            <tr>
                <td>
                    <div style="font-weight:600;">${nombre}</div>
                </td>
                <td align="right">
                    <input type="number" id="lec-${i}" class="lec-input" style="width:50px;">
                    <input type="checkbox" class="check-asis" data-idx="${i}">
                </td>
            </tr>`;
        
        if (tipo.includes("bautizado")) tbB.innerHTML += rowHtml;
        else tbA.innerHTML += rowHtml;
    });
}

// 5. ENVÍO
async function enviarAsistencia() {
    const checks = document.querySelectorAll('.check-asis:checked');
    if (checks.length === 0) return alert("Seleccione al menos una persona.");

    const btn = document.getElementById('btnEnviar');
    const motivo = document.getElementById('motivoReunion').value;

    const fechaVal = document.getElementById('fechaManual').value;
    const liderVal = document.getElementById('selectLider').value;
    const grupoVal = document.getElementById('nombreGrupo').value;

    if (!fechaVal || !liderVal || !grupoVal) {
        return alert("Complete todos los campos.");
    }

    const registros = [];

    for (let check of checks) {
        const idx = check.getAttribute('data-idx');
        const persona = integrantes[idx];

        registros.push({
            dni: persona.DNI, // 🔥 FIX CLAVE
            nombre: persona.Nombres,
            leccionNum: document.getElementById(`lec-${idx}`).value || "1"
        });
    }

    const payload = {
        destino: "ASISTENCIA",
        reporteAsist: {
            lider: liderVal,
            fecha: fechaVal,
            grupo: grupoVal,
            motivo: motivo
        },
        registros
    };

    try {
        btn.disabled = true;
        btn.innerText = "🚀 Guardando...";
        
        await fetch(urlApp, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        btn.innerText = "✅ Guardado";
        btn.style.background = "#1e8e3e";
        
    } catch (err) {
        alert("Error al enviar el reporte.");
        btn.disabled = false;
        btn.innerText = "Guardar Reporte General";
    }
}
