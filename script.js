// REEMPLAZA ESTA URL por la de tu Implementación de Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxR5m5G-wXFv6evrrQex_SjwBGYxZtIxleck6UI-Xsi4Jeqdj6iXFutwoUjM5YxaFN1UA/exec"; 
let integrantes = [];

// Mostrar fecha actual en el badge
document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();

/**
 * CARGAR LISTA: Obtiene los integrantes filtrados por el Líder seleccionado
 */
async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if(!lider) return;
    
    try {
        const res = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        integrantes = await res.json();
        renderizarTablas();
    } catch(e) { 
        console.error("Error:", e);
        alert("Error cargando integrantes. Verifique la conexión o el ID del líder."); 
    }
}

/**
 * RENDERIZAR: Dibuja las tablas dividiendo Bautizados de Amigos
 */
function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    tbB.innerHTML = ''; 
    tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        // Detectar si es Bautizado o Amigo (Soporta mayúsculas/minúsculas en el Excel)
        const tipoUsuario = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const nombreUsuario = p.Nombres || p.NOMBRES || "Sin Nombre";
        
        const esB = tipoUsuario.includes("bautizado");
        
        const html = `
            <tr>
                <td>${nombreUsuario}</td>
                <td align="right">
                    <input type="number" id="lec-${i}" class="lec-input" placeholder="0" min="0">
                    <input type="checkbox" class="check-asis" data-idx="${i}">
                </td>
            </tr>`;
        
        if(esB) {
            tbB.innerHTML += html;
        } else {
            tbA.innerHTML += html;
        }
    });
}

/**
 * MARCAR/LIMPIAR: Selecciona o deselecciona todos los checkboxes
 */
function marcarBloque(v) { 
    document.querySelectorAll('.check-asis').forEach(c => c.checked = v); 
}

/**
 * ENVIAR DATOS: Procesa la información y la envía al servidor
 */
function enviarDatos() {
    const lider = document.getElementById('liderGp').value;
    const grupo = document.getElementById('nombreGrupo').value;
    
    if(!lider || !grupo) {
        return alert("Por favor, seleccione un Líder y escriba el Nombre del Grupo.");
    }

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerText = "Enviando reporte...";

    let inasistentesNombres = [];
    let dAmigos = [];
    let nA = 0; // Asistentes
    let nI = 0; // Inasistentes
    let sumaLecBautizados = 0;
    let sumaLecAmigos = 0;

    integrantes.forEach((p, i) => {
        const asisCheckbox = document.querySelector(`.check-asis[data-idx="${i}"]`);
        const asis = asisCheckbox ? asisCheckbox.checked : false;
        const lecInput = document.getElementById(`lec-${i}`);
        const lec = parseInt(lecInput.value) || 0;
        
        const tipoUsuario = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const esBautizado = tipoUsuario.includes("bautizado");
        const nombreParaRegistro = p.Nombres || p.NOMBRES;

        if (asis) {
            nA++;
            if (esBautizado) sumaLecBautizados += lec;
            else sumaLecAmigos += lec;
        } else {
            nI++;
            inasistentesNombres.push(nombreParaRegistro); 
        }

        // MIGRACIÓN A HOJA AMIGOS: 
        // Solo si NO es bautizado (Amigo de esperanza) y tiene una lección marcada (>0)
        if (!esBautizado && lec > 0) {
            dAmigos.push({ 
                nombre: nombreParaRegistro, 
                leccionNum: lec, 
                fecha: new Date().toLocaleDateString() 
            });
        }
    });

    const porc = integrantes.length > 0 ? ((nA / integrantes.length) * 100).toFixed(0) + "%" : "0%";

    // Objeto consolidado para la hoja "Asist" (Una sola fila por reporte)
    const reporteAsist = {
        lider: lider,
        fecha: new Date().toLocaleDateString(),
        grupo: grupo,
        motivo: document.getElementById('motivo').value,
        nombresInasistentes: inasistentesNombres.length > 0 ? inasistentesNombres.join(", ") : "Ninguno",
        sexoRelativo: "Mixto", 
        tipoRelativo: "Grupal",
        porc: porc,
        les: "S/. " + (document.getElementById('totalLes').value || 0),
        ofr: "S/. " + (document.getElementById('totalOfrendas').value || 0),
        nA: nA,
        nI: nI,
        nB: document.getElementById('numBautismo').value || 0,
        lLES_Total: sumaLecBautizados,
        lBib_Total: sumaLecAmigos
    };

    // Envío de datos mediante POST
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Importante para evitar errores de CORS con Apps Script
        body: JSON.stringify({ 
            destino: "ASISTENCIA", 
            reporteAsist: reporteAsist, 
            registrosAmigos: dAmigos 
        })
    })
    .then(() => {
        // Mostrar modal de éxito
        document.getElementById('modalResumen').style.display = 'flex';
    })
    .catch((error) => {
        console.error("Error al enviar:", error);
        alert("Hubo un error al guardar. Revise su conexión.");
        btn.disabled = false;
        btn.innerText = "Guardar Reporte General";
    });
}
