const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyE3nkfQK2DYcVEtqkEN1dPc8VPFKQmfmwhdHWQUCb4pf6ug7RB6H_ATqtl3fZPsHzA8A/exec"; 
let integrantes = [];

document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();

// Carga la lista de personas según el líder seleccionado
async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if(!lider) return;
    
    try {
        const res = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        integrantes = await res.json();
        renderizarTablas();
    } catch(e) { alert("Error al cargar la lista del Padrón."); }
}

function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    tbB.innerHTML = ''; tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        const nombre = p.Nombres || p.NOMBRES;
        const tipo = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const esB = tipo.includes("bautizado");

        const rowHtml = `
            <tr>
                <td>${nombre}</td>
                <td align="right">
                    <input type="number" id="lec-${i}" class="lec-input" placeholder="N°" min="1" max="20">
                    <input type="checkbox" class="check-asis" data-idx="${i}">
                </td>
            </tr>`;
        
        esB ? tbB.innerHTML += rowHtml : tbA.innerHTML += rowHtml;
    });
}

function marcarBloque(v) { 
    document.querySelectorAll('.check-asis').forEach(c => c.checked = v); 
}

function enviarDatos() {
    const lider = document.getElementById('liderGp').value;
    const grupo = document.getElementById('nombreGrupo').value;
    if(!lider || !grupo) return alert("Complete Líder y Nombre del Grupo");

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerText = "Enviando...";

    let inasistentes = [];
    let dAmigos = [];
    let nA = 0, nI = 0;
    let sumaLecB = 0, sumaLecA = 0;

    integrantes.forEach((p, i) => {
        const asis = document.querySelector(`.check-asis[data-idx="${i}"]`).checked;
        const lec = parseInt(document.getElementById(`lec-${i}`).value) || 0;
        const tipo = (p.Tipo || p.TIPO || "").toString().toLowerCase();
        const esB = tipo.includes("bautizado");
        const nombre = p.Nombres || p.NOMBRES;

        if (asis) {
            nA++;
            esB ? sumaLecB += lec : sumaLecA += lec;
        } else {
            nI++;
            inasistentes.push(nombre);
        }

        // Migración a AMIGOS: Solo si NO es bautizado y tiene lección marcada
        if (!esB && lec > 0) {
            dAmigos.push({
                nombre: nombre,
                leccionNum: lec,
                fecha: new Date().toLocaleDateString(),
                lider: lider,
                grupo: grupo
            });
        }
    });

    const reporteAsist = {
        lider: lider,
        fecha: new Date().toLocaleDateString(),
        grupo: grupo,
        motivo: document.getElementById('motivo').value,
        nombresInasistentes: inasistentes.join(", "),
        sexoRelativo: "Mixto",
        tipoRelativo: "Grupal",
        porc: ((nA / integrantes.length) * 100).toFixed(0) + "%",
        les: document.getElementById('totalLes').value,
        ofr: document.getElementById('totalOfrendas').value,
        nA: nA, nI: nI,
        nB: document.getElementById('numBautismo').value,
        lLES_Total: sumaLecB,
        lBib_Total: sumaLecA
    };

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ 
            destino: "ASISTENCIA", 
            reporteAsist: reporteAsist, 
            registrosAmigos: dAmigos 
        })
    }).then(() => {
        document.getElementById('modalResumen').style.display = 'flex';
    }).catch(() => {
        alert("Error de conexión");
        btn.disabled = false;
        btn.innerText = "Guardar Reporte General";
    });
}
