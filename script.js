const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw4z23uUq9mtcrelMsObwoRD43Yy1nM-q9RDgKvOxySc-YsSegEbI4CYjfYmwRxdxTiWA/exec";
let listaIntegrantes = [];

document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();

async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if (!lider) return;

    // Limpiar tablas
    document.querySelector('#tablaBautizados tbody').innerHTML = "<tr><td colspan='2'>Cargando...</td></tr>";
    document.querySelector('#tablaAmigos tbody').innerHTML = "<tr><td colspan='2'>Cargando...</td></tr>";

    try {
        const response = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await response.json();
        renderizarTablas();
    } catch (error) {
        alert("Error al conectar con la base de datos");
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
            <td><input type="checkbox" class="asis-check" data-index="${index}"></td>
        </tr>`;
        
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

async function enviarAsistencia() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const nombreGrupo = document.getElementById('nombreGrupo').value;
    const motivo = document.getElementById('motivo').value;

    if (!lider || !nombreGrupo) {
        return alert("Por favor complete el Líder y Nombre del Grupo");
    }

    btn.disabled = true;
    btn.innerText = "Registrando...";

    const checks = document.querySelectorAll('.asis-check');
    const fecha = new Date().toLocaleDateString();
    
    // Conteo para porcentajes
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

    // Calcular % para cada registro enviado
    registros.forEach(reg => {
        const c = conteo[reg.tipo];
        reg.porcentajeAsis = ((c.asis / c.tot) * 100).toFixed(1) + "%";
    });

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Importante para Apps Script desde dominios externos
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destino: "ASISTENCIA", registros: registros })
        });
        
        alert("¡Asistencia guardada exitosamente!");
        location.reload();
    } catch (error) {
        alert("Error al enviar datos");
        btn.disabled = false;
        btn.innerText = "Guardar Asistencia";
    }
}
