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
    
    tbodyB.innerHTML = "<tr><td colspan='2' class='empty-msg'>Buscando integrantes...</td></tr>";
    tbodyA.innerHTML = "<tr><td colspan='2' class='empty-msg'>Buscando integrantes...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await response.json();
        renderizarTablas();
    } catch (error) {
        console.error("Error al cargar:", error);
        alert("No se pudo conectar con la base de datos.");
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
        tbodyB.innerHTML = "<tr><td colspan='2' class='empty-msg'>No hay integrantes para este líder.</td></tr>";
        return;
    }

    listaIntegrantes.forEach((persona, index) => {
        const filaHtml = `
            <tr>
                <td>${persona.Nombres}</td>
                <td style="text-align:right">
                    <input type="number" step="0.10" class="cuota-input" id="monto-${index}" placeholder="S/." style="width:65px; margin-right:10px;">
                    <input type="checkbox" class="asis-check" data-index="${index}">
                </td>
            </tr>`;
        
        if (persona.Tipo && persona.Tipo.trim().toLowerCase().includes("bautizado")) {
            tbodyB.innerHTML += filaHtml;
        } else {
            tbodyA.innerHTML += filaHtml;
        }
    });
}

function marcarBloque(estado) {
    document.querySelectorAll('.asis-check').forEach(chk => {
        chk.checked = estado;
    });
}

/**
 * Procesa la asistencia y muestra los totales en la alerta de éxito
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
    
    let totalesPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    listaIntegrantes.forEach(p => {
        let t = (p.Tipo && p.Tipo.trim().toLowerCase().includes("bautizado")) ? "Bautizado" : "Amigo de esperanza";
        totalesPorTipo[t]++;
    });

    let asistieronPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    let registrosParaEnviar = [];
    let sumaTotalSoles = 0;

    checks.forEach(chk => {
        if (chk.checked) {
            const idx = chk.dataset.index;
            const p = listaIntegrantes[idx];
            let t = (p.Tipo && p.Tipo.trim().toLowerCase().includes("bautizado")) ? "Bautizado" : "Amigo de esperanza";
            
            asistieronPorTipo[t]++;
            
            const inputMonto = document.getElementById(`monto-${idx}`);
            const montoNum = (inputMonto && inputMonto.value) ? parseFloat(inputMonto.value) : 0;
            sumaTotalSoles += montoNum;
            
            registrosParaEnviar.push({
                liderGp: lider,
                fecha: fechaEnvio,
                nombreGrupo: nombreGrupo,
                motivo: motivo,
                nombre: p.Nombres,
                sexo: p.Sexo,
                tipo: p.Tipo,
                tipoRef: t,
                soles: "S/. " + montoNum.toFixed(2)
            });
        }
    });

    if (registrosParaEnviar.length === 0) {
        alert("Debe marcar al menos a una persona.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
        return;
    }

    // Cálculo de porcentajes para el envío y para la alerta
    let porcB = totalesPorTipo["Bautizado"] > 0 ? ((asistieronPorTipo["Bautizado"] / totalesPorTipo["Bautizado"]) * 100).toFixed(1) : "0";
    let porcA = totalesPorTipo["Amigo de esperanza"] > 0 ? ((asistieronPorTipo["Amigo de esperanza"] / totalesPorTipo["Amigo de esperanza"]) * 100).toFixed(1) : "0";

    registrosParaEnviar.forEach(reg => {
        reg.porcentajeAsis = reg.tipoRef === "Bautizado" ? porcB + "%" : porcA + "%";
    });

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            destino: "ASISTENCIA",
            registros: registrosParaEnviar
        })
    })
    .then(() => {
        // Alerta personalizada con el resumen solicitado
        const mensajeExito = `¡Éxito! Los datos se registraron correctamente.
--------------------------------------------
Resumen de Asistencia:
• Bautizados: ${asistieronPorTipo["Bautizado"]} de ${totalesPorTipo["Bautizado"]} (${porcB}%)
• Amigos: ${asistieronPorTipo["Amigo de esperanza"]} de ${totalesPorTipo["Amigo de esperanza"]} (${porcA}%)
--------------------------------------------
TOTAL RECAUDADO: S/. ${sumaTotalSoles.toFixed(2)}`;

        alert(mensajeExito);
        location.reload(); 
    })
    .catch(err => {
        console.error("Error al enviar:", err);
        alert("Hubo un error al guardar.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
    });
}
