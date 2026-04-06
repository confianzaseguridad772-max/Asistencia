// URL de tu última implementación de Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTPU8cKwqmLShbh_k9l1pf3ZnnNjpo3VSjo_PIZGTpwydXJbMPi2Th0fnbTXOYZ4u5QA/exec";
let listaIntegrantes = [];

// Mostrar fecha actual al cargar
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

    // Referencias a las tablas
    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    
    // Mensaje de carga
    tbodyB.innerHTML = "<tr><td colspan='2'>Buscando integrantes...</td></tr>";
    tbodyA.innerHTML = "<tr><td colspan='2'>Buscando integrantes...</td></tr>";

    try {
        // Petición GET al script con el parámetro lider
        const response = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await response.json();
        renderizarTablas();
    } catch (error) {
        console.error("Error al cargar:", error);
        alert("No se pudo conectar con la base de datos. Verifique la URL del Script.");
    }
}

/**
 * Dibuja los nombres en las tablas correspondientes
 */
function renderizarTablas() {
    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    tbodyB.innerHTML = '';
    tbodyA.innerHTML = '';

    if (listaIntegrantes.length === 0) {
        tbodyB.innerHTML = "<tr><td colspan='2'>No hay integrantes registrados.</td></tr>";
        return;
    }

    listaIntegrantes.forEach((persona, index) => {
        const filaHtml = `
            <tr>
                <td>${persona.Nombres}</td>
                <td style="text-align:right">
                    <input type="checkbox" class="asis-check" data-index="${index}">
                </td>
            </tr>`;
        
        // Clasificar según la columna "Tipo" de tu Excel
        if (persona.Tipo === "Bautizado") {
            tbodyB.innerHTML += filaHtml;
        } else {
            tbodyA.innerHTML += filaHtml;
        }
    });
}

/**
 * Función para marcar o desmarcar todos los checks a la vez
 */
function marcarBloque(estado) {
    document.querySelectorAll('.asis-check').forEach(chk => {
        chk.checked = estado;
    });
}

/**
 * Procesa la asistencia, calcula porcentajes y envía los datos al Sheets
 */
function enviarAsistencia() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const nombreGrupo = document.getElementById('nombreGrupo').value;
    const motivo = document.getElementById('motivo').value;

    // Validación básica
    if (!lider || !nombreGrupo) {
        alert("Por favor, seleccione el Líder y escriba el Nombre del Grupo.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Registrando en Vertical...";

    const fechaEnvio = new Date().toLocaleDateString();
    const checks = document.querySelectorAll('.asis-check');
    
    // 1. Contar totales del padrón para este líder para el %
    let totalesPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    listaIntegrantes.forEach(p => {
        let t = (p.Tipo === "Bautizado") ? "Bautizado" : "Amigo de esperanza";
        totalesPorTipo[t]++;
    });

    // 2. Contar quiénes marcaron asistencia
    let asistieronPorTipo = { "Bautizado": 0, "Amigo de esperanza": 0 };
    let registrosParaEnviar = [];

    checks.forEach(chk => {
        if (chk.checked) {
            const idx = chk.dataset.index;
            const p = listaIntegrantes[idx];
            let t = (p.Tipo === "Bautizado") ? "Bautizado" : "Amigo de esperanza";
            
            asistieronPorTipo[t]++;
            
            // Crear objeto de fila para esta persona
            registrosParaEnviar.push({
                liderGp: lider,
                fecha: fechaEnvio,
                nombreGrupo: nombreGrupo,
                motivo: motivo,
                nombre: p.Nombres,
                sexo: p.Sexo,
                tipo: p.Tipo,
                tipoClasificacion: t // Auxiliar para el %
            });
        }
    });

    if (registrosParaEnviar.length === 0) {
        alert("Debe marcar al menos a una persona.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
        return;
    }

    // 3. Asignar el porcentaje calculado a cada fila individual (Vertical)
    registrosParaEnviar.forEach(reg => {
        const total = totalesPorTipo[reg.tipoClasificacion];
        const asis = asistieronPorTipo[reg.tipoClasificacion];
        reg.porcentajeAsis = ((asis / total) * 100).toFixed(1) + "%";
        // Nota: La columna S/.LES se gestiona en el Apps Script como columna vacía
    });

    // 4. Enviar mediante POST
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Requerido para evitar bloqueos de Google
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify({
            destino: "ASISTENCIA",
            registros: registrosParaEnviar
        })
    })
    .then(() => {
        alert("¡Éxito! La asistencia se registró fila por fila en la hoja 'Asist'.");
        location.reload(); // Limpiar formulario
    })
    .catch(err => {
        console.error("Error al enviar:", err);
        alert("Hubo un error al guardar. Intente nuevamente.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
    });
}
