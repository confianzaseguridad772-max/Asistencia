// Variables globales
let integrantes = [];
const urlApp = "https://script.google.com/macros/s/AKfycbz5xqHgOBTf6E_1Yswow2i9BAcRGc_gJo8x4TbmOmn2xwCfEi7KKsRhYRmruCi7SWm09A/exec"; // Reemplaza con tu URL de implementación real

// 1. CONFIGURACIÓN INICIAL AL CARGAR LA PÁGINA
window.onload = function() {
    const fechaInput = document.getElementById('fechaManual');
    const fechaDisplay = document.getElementById('fechaDisplay');
    const hoy = new Date();
    
    // Ajustar fecha para el input (YYYY-MM-DD) evitando desfase de zona horaria
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
    if(fechaInput) fechaInput.value = fechaLocal.toISOString().split('T')[0];
    
    // Mostrar fecha en el badge superior (DD/MM/YYYY)
    if(fechaDisplay) fechaDisplay.innerText = hoy.toLocaleDateString('es-PE');

    // Escuchar cambios en el motivo para ocultar/mostrar tablas en tiempo real
    const motivoSelect = document.getElementById('motivoReunion');
    if(motivoSelect) {
        motivoSelect.addEventListener('change', gestionarVisibilidad);
        // Ejecutar una vez al cargar por si ya hay un valor por defecto
        gestionarVisibilidad();
    }
};

// 2. FUNCIÓN PARA BUSCAR POR LÍDER Y VERIFICAR DONES
async function buscarPorLider() {
    const lider = document.getElementById('selectLider').value;
    if (!lider) return;

    const loading = document.getElementById('loading');
    if(loading) loading.style.display = 'block';

    try {
        const resp = await fetch(`${urlApp}?lider=${encodeURIComponent(lider)}`);
        integrantes = await resp.json();
        
        // Dibujar los datos en las tablas
        renderizarTablas();
        
        // Aplicar el filtro de visibilidad según el motivo seleccionado
        gestionarVisibilidad();
        
    } catch (err) {
        console.error("Error al obtener datos:", err);
        alert("Error al conectar con el servidor.");
    } finally {
        if(loading) loading.style.display = 'none';
    }
}

// 3. FUNCIÓN: CONTROL DE VISIBILIDAD DE MÓDULOS
function gestionarVisibilidad() {
    const motivo = document.getElementById('motivoReunion').value;
    const secBautizados = document.getElementById('seccionBautizados');
    const secAmigos = document.getElementById('seccionAmigos');

    if (!secBautizados || !secAmigos) return;

    console.log("Cambiando visibilidad para:", motivo);

    if (motivo === "GP:Estudios biblicos") {
        // Solo visualiza el modulo "Amigos de esperanza"
        secBautizados.setAttribute('style', 'display: none !important');
        secAmigos.setAttribute('style', 'display: block !important');
    } else {
        // GP:Hogares o GP:Unidades de Acción (Visualiza ambos)
        secBautizados.setAttribute('style', 'display: block !important');
        secAmigos.setAttribute('style', 'display: block !important');
    }
}

// 4. FUNCIÓN PARA DIBUJAR LAS TABLAS
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
                    <div style="font-weight: 600; color: #333;">${nombre}</div>
                    <small style="color: ${colorDones}; font-weight: 800; font-size: 0.7rem;">
                        ¿REGISTRO DONES?: ${tieneDones}
                    </small>
                </td>
                <td align="right" style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                        <input type="number" id="lec-${i}" class="lec-input" 
                               placeholder="N°" min="1" max="20" 
                               style="width: 50px; padding: 5px; border: 1px solid #ddd; border-radius: 6px; text-align: center;">
                        <input type="checkbox" class="check-asis" data-idx="${i}" 
                               style="width: 22px; height: 22px; cursor: pointer; accent-color: #1a73e8;">
                    </div>
                </td>
            </tr>`;
        
        if (esBautizado) {
            tbB.innerHTML += rowHtml;
        } else {
            tbA.innerHTML += rowHtml;
        }
    });
}

// 5. FUNCIÓN PARA ENVIAR ASISTENCIA (MIGRACIÓN DINÁMICA)
async function enviarAsistencia() {
    const checks = document.querySelectorAll('.check-asis:checked');
    if (checks.length === 0) return alert("Por favor, seleccione al menos a una persona.");

    const btn = document.getElementById('btnEnviar');
    const todosLosRegistros = [];
    
    const fechaSeleccionada = document.getElementById('fechaManual').value;
    const motivo = document.getElementById('motivoReunion').value;
    const liderSeleccionado = document.getElementById('selectLider').value;
    const nombreGrupo = document.getElementById('nombreGrupo').value;

    const totalLes = document.getElementById('totalLes').value || 0;
    const totalOfrendas = document.getElementById('totalOfrendas').value || 0;
    const numBautismo = document.getElementById('numBautismo').value || 0;

    checks.forEach(check => {
        const idx = check.getAttribute('data-idx');
        const persona = integrantes[idx];
        const numLeccion = document.getElementById(`lec-${idx}`).value || "1";
        const tipoPersona = (persona.Tipo || persona.TIPO || "");

        todosLosRegistros.push({
            nombre: (persona.Nombres || persona.NOMBRES),
            leccionNum: numLeccion,
            fecha: fechaSeleccionada,
            lider: liderSeleccionado,
            grupo: nombreGrupo,
            tipo: tipoPersona
        });
    });

    const payload = {
        destino: "ASISTENCIA",
        reporteAsist: {
            lider: liderSeleccionado,
            fecha: fechaSeleccionada,
            grupo: nombreGrupo,
            motivo: motivo,
            les: totalLes,
            ofr: totalOfrendas,
            nB: numBautismo
        },
        registros: todosLosRegistros // El servidor filtrará por motivo para Amigos/Hogares/Unidad
    };

    try {
        btn.disabled = true;
        btn.innerText = "🚀 Enviando...";

        await fetch(urlApp, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify(payload)
        });

        document.getElementById('modalResumen').style.display = 'flex';
        
    } catch (err) {
        console.error("Error al enviar:", err);
        alert("Hubo un error al guardar los datos.");
        btn.disabled = false;
        btn.innerText = "Guardar Reporte General";
    }
}
