// URL de tu última implementación de Apps Script (Actualizada)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzib9tCY-tH3yGtOKEzOeL6v1T4MjyGn0QnTYYNL0vHCQNNssdZb47pnykdzvGsS7OJFA/exec";
let listaIntegrantes = [];

// Mostrar fecha actual al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const fechaElemento = document.getElementById('fechaActual');
    if (fechaElemento) {
        fechaElemento.innerText = "Fecha: " + new Date().toLocaleDateString();
    }
});

/**
 * Carga la lista de integrantes desde la hoja "Padron" filtrando por el Líder seleccionado
 */
async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if (!lider) return;

    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    
    // Mensaje visual de carga
    tbodyB.innerHTML = "<tr><td colspan='2'>Buscando integrantes...</td></tr>";
    tbodyA.innerHTML = "<tr><td colspan='2'>Buscando integrantes...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await response.json();
        renderizarTablas();
    } catch (error) {
        console.error("Error al cargar:", error);
        alert("No se pudo conectar con la base de datos. Verifique su conexión.");
    }
}

/**
 * Renderiza los nombres en las tablas y añade el input para S/.LES
 */
function renderizarTablas() {
    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    tbodyB.innerHTML = '';
    tbodyA.innerHTML = '';

    if (listaIntegrantes.length === 0) {
        tbodyB.innerHTML = "<tr><td colspan='2'>No hay integrantes para este líder.</td></tr>";
        return;
    }

    listaIntegrantes.forEach((persona, index) => {
        const filaHtml = `
            <tr>
                <td>${persona.Nombres}</td>
                <td style="text-align:right">
                    <input type="number" step="0.10" class="cuota-input" id="monto-${index}" placeholder="S/." style="width:60px; margin-right:10px; border-radius:5px; border:1px solid #ccc;">
                    <input type="checkbox" class="asis-check" data-index="${index}" style="transform: scale(1.3);">
                </td>
            </tr>`;
        
        // Clasificación según la columna "Tipo" del Excel
        if (persona.Tipo === "Bautizado") {
            tbodyB.innerHTML += filaHtml;
        } else {
            tbodyA.innerHTML += filaHtml;
        }
    });
}

/**
 * Función para marcar o desmarcar todos los checks
 */
function marcarBloque(estado) {
    document.querySelectorAll('.asis-check').forEach(chk => {
        chk.checked = estado;
    });
}

/**
 * Procesa la asistencia en VERTICAL, calcula porcentajes y envía los datos
 */
function enviarAsistencia() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const nombreGrupo = document.getElementById('nombreGrupo').value;
    const motivo = document.getElementById('motivo').value;

    if (!lider || !nombreGrupo) {
        alert("Por favor, complete el Líder y el Nombre del Grupo.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Registrando en Excel...";

    const fechaEnvio = new Date().toLocaleDateString();
    const checks = document.querySelectorAll('.asis-check');
    
    // 1. Calcular totales del padrón para sacar el % exacto
    let totalesPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    listaIntegrantes.forEach(p => {
        let t = (p.Tipo === "Bautizado") ? "Bautizado" : "Amigo de esperanza";
        totalesPorTipo[t]++;
    });

    // 2. Filtrar solo los que asistieron y recolectar sus montos S/.LES
    let asistieronPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    let registrosParaEnviar = [];

    checks.forEach(chk => {
        if (chk.checked) {
            const idx = chk.dataset.index;
            const p = listaIntegrantes[idx];
            let t = (p.Tipo === "Bautizado") ? "Bautizado" : "Amigo de esperanza";
            
            asistieronPorTipo[t]++;
            
            // Capturar el monto S/.LES individual
            const montoIndividual = document.getElementById(`monto-${idx}`).value || "0.00";
            
            registrosParaEnviar.push({
                liderGp: lider,
                fecha: fechaEnvio,
                nombreGrupo: nombreGrupo,
                motivo: motivo,
                nombre: p.Nombres,
                sexo: p.Sexo,
                tipo: p.Tipo,
                tipoRef: t, // Referencia para el cálculo de %
                soles: montoIndividual
            });
        }
    });

    if (registrosParaEnviar.length === 0) {
        alert("Debe marcar al menos a una persona.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
        return;
    }

    // 3. Asignar el porcentaje correspondiente a cada fila (Vertical)
    registrosParaEnviar.forEach(reg => {
        const total = totalesPorTipo[reg.tipoRef];
        const asis = asistieronPorTipo[reg.tipoRef];
        reg.porcentajeAsis = ((asis / total) * 100).toFixed(1) + "%";
    });

    // 4. Envío de datos al Google Sheets
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify({
            destino: "ASISTENCIA",
            registros: registrosParaEnviar
        })
    })
    .then(() => {
        alert("¡Éxito! La asistencia y montos S/.LES se registraron en la hoja 'Asist'.");
        location.reload(); 
    })
    .catch(err => {
        console.error("Error al enviar:", err);
        alert("Hubo un error al guardar. Verifique su conexión.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
    });
}
