// Variables globales
let integrantes = [];
const urlApp = "https://script.google.com/macros/s/AKfycbzohv07LL1Bnqv3tnQ5ZDqDesy_2PnPktORD3wn-uF1VEF-Wwf14y2QMo8LS272AU0GuQ/exec"; // Reemplaza con tu URL de implementación

// 1. FUNCIÓN PARA BUSCAR POR LÍDER
async function buscarPorLider() {
    const lider = document.getElementById('selectLider').value;
    if (!lider) return alert("Seleccione un líder");

    // Mostrar indicador de carga si tienes uno
    document.getElementById('loading').style.display = 'block';

    try {
        const resp = await fetch(`${urlApp}?lider=${encodeURIComponent(lider)}`);
        integrantes = await resp.json();
        renderizarTablas();
    } catch (err) {
        console.error("Error al obtener datos:", err);
        alert("Error al conectar con el servidor");
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 2. FUNCIÓN PARA DIBUJAR LAS TABLAS CON VALIDACIÓN DE DONES
function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    
    // Limpiar tablas antes de llenar
    tbB.innerHTML = ''; 
    tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        // Normalización de nombres de campos según el JSON del servidor
        const nombre = p.Nombres || p.NOMBRES || "Sin Nombre";
        const tipo = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const esBautizado = tipo.includes("bautizado");
        
        // Lógica de Dones (SI/NO) calculada en el Apps Script
        const tieneDones = p.TieneDones || "NO";
        const colorDones = tieneDones === "SI" ? "#1e8e3e" : "#d93025"; // Verde o Rojo

        const rowHtml = `
            <tr>
                <td>
                    <div style="font-weight: 500;">${nombre}</div>
                    <small style="color: ${colorDones}; font-weight: bold; font-size: 0.75rem;">
                        ¿REGISTRO DONES?: ${tieneDones}
                    </small>
                </td>
                <td align="right" style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <input type="number" id="lec-${i}" class="lec-input" 
                               placeholder="N°" min="1" max="20" 
                               style="width: 45px; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
                        <input type="checkbox" class="check-asis" data-idx="${i}" 
                               style="width: 20px; height: 20px; cursor: pointer;">
                    </div>
                </td>
            </tr>`;
        
        // Separar en la tabla correspondiente
        if (esBautizado) {
            tbB.innerHTML += rowHtml;
        } else {
            tbA.innerHTML += rowHtml;
        }
    });
}

// 3. FUNCIÓN PARA ENVIAR ASISTENCIA
async function enviarAsistencia() {
    const checks = document.querySelectorAll('.check-asis:checked');
    if (checks.length === 0) return alert("Marque al menos una asistencia");

    const registrosAmigos = [];
    const fechaActual = new Date().toLocaleDateString('es-PE');
    const liderSeleccionado = document.getElementById('selectLider').value;
    const nombreGrupo = "Vencedores"; // Puedes hacerlo dinámico si gustas

    checks.forEach(check => {
        const idx = check.getAttribute('data-idx');
        const persona = integrantes[idx];
        const numLeccion = document.getElementById(`lec-${idx}`).value || "1";

        registrosAmigos.push({
            nombre: (persona.Nombres || persona.NOMBRES),
            leccionNum: numLeccion,
            fecha: fechaActual,
            lider: liderSeleccionado,
            grupo: nombreGrupo
        });
    });

    const payload = {
        destino: "ASISTENCIA",
        reporteAsist: {
            lider: liderSeleccionado,
            fecha: fechaActual,
            grupo: nombreGrupo,
            // Aquí puedes agregar los demás campos de tu reporte general si los necesitas
        },
        registrosAmigos: registrosAmigos
    };

    try {
        const btn = document.getElementById('btnEnviar');
        btn.disabled = true;
        btn.innerText = "Enviando...";

        const response = await fetch(urlApp, {
            method: 'POST',
            mode: 'no-cors', // Importante para Google Apps Script
            cache: 'no-cache',
            body: JSON.stringify(payload)
        });

        alert("Asistencia enviada con éxito");
        location.reload(); // Recargar para limpiar
    } catch (err) {
        console.error("Error al enviar:", err);
        alert("Error al guardar la asistencia");
    }
}
