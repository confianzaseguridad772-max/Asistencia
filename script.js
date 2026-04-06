const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbydzLKrDpZcN_2THNkPGKyhA9Pab4vdLBcMeEFtlX91j9ruuv6LFeYO8eFS41-v7Bq1bQ/exec";
let listaIntegrantes = [];

document.getElementById('fechaActual').innerText = "Fecha: " + new Date().toLocaleDateString();

// Función para cargar los integrantes desde el Sheets
async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if (!lider) return;

    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    tbodyB.innerHTML = "<tr><td colspan='2'>Cargando integrantes...</td></tr>";
    tbodyA.innerHTML = "<tr><td colspan='2'>Cargando integrantes...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await response.json();
        renderizarTablas();
    } catch (error) {
        alert("Error al obtener datos. Verifique su conexión.");
        console.error(error);
    }
}

function renderizarTablas() {
    const tbodyB = document.querySelector('#tablaBautizados tbody');
    const tbodyA = document.querySelector('#tablaAmigos tbody');
    tbodyB.innerHTML = '';
    tbodyA.innerHTML = '';

    listaIntegrantes.forEach((persona, index) => {
        const row = `<tr>
            <td>${persona.Nombres}</td>
            <td style="text-align:right"><input type="checkbox" class="asis-check" data-index="${index}"></td>
        </tr>`;
        
        // Clasificación por tipo
        if (persona.Tipo === "Bautizado") {
            tbodyB.innerHTML += row;
        } else {
            tbodyA.innerHTML += row;
        }
    });
}

function marcarBloque(estado) {
    document.querySelectorAll('.asis-check').forEach(chk => chk.checked = estado);
}

// Función para enviar la asistencia al Sheets
function enviarAsistencia() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const nombreGrupo = document.getElementById('nombreGrupo').value;
    const motivo = document.getElementById('motivo').value;

    if (!lider || !nombreGrupo) {
        alert("Complete el Líder y el Nombre del Grupo antes de guardar.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Registrando en Sheets...";

    const fecha = new Date().toLocaleDateString();
    const checks = document.querySelectorAll('.asis-check');
    
    // Cálculo de porcentaje por tipo
    let conteo = { "Bautizado": { tot: 0, asis: 0 }, "Amigos de Esperanza": { tot: 0, asis: 0 } };
    listaIntegrantes.forEach(p => { if(conteo[p.Tipo]) conteo[p.Tipo].tot++; });

    let registros = [];
    checks.forEach(chk => {
        const p = listaIntegrantes[chk.dataset.index];
        if (chk.checked) {
            conteo[p.Tipo].asis++;
            registros.push({
                liderGp: lider,
                fecha: fecha,
                nombreGrupo: nombreGrupo,
                motivo: motivo,
                nombre: p.Nombres,
                sexo: p.Sexo,
                tipo: p.Tipo
            });
        }
    });

    // Asignar porcentaje calculado a cada fila del registro
    registros.forEach(reg => {
        const c = conteo[reg.tipo];
        reg.porcentajeAsis = c.tot > 0 ? ((c.asis / c.tot) * 100).toFixed(1) + "%" : "0%";
    });

    // Envío de datos mediante POST
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ destino: "ASISTENCIA", registros: registros })
    })
    .then(() => {
        alert("¡Asistencia registrada correctamente!");
        location.reload(); // Recarga para limpiar el formulario
    })
    .catch(err => {
        console.error(err);
        alert("Ocurrió un error al enviar. Verifique su conexión.");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
    });
}
