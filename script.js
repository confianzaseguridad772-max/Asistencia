const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMTvPSScbiQ-d67ydnk6EfgWkD11MklVClrh8Z56BD2AJVNB5j6CvpWsHT7CvpF5Kbmg/exec"; 
let integrantes = [];

document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();

async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if(!lider) return;
    try {
        const res = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        integrantes = await res.json();
        renderizarTablas();
    } catch(e) { alert("Error cargando integrantes"); }
}

function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    tbB.innerHTML = ''; tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        // Normalizamos la búsqueda de "Bautizado" sin importar mayúsculas
        const esB = p.Tipo && p.Tipo.toString().toLowerCase().includes("bautizado");
        const html = `<tr>
            <td>${p.Nombres}</td>
            <td align="right">
                <input type="number" id="lec-${i}" class="lec-input" placeholder="0">
                <input type="checkbox" class="check-asis" data-idx="${i}">
            </td>
        </tr>`;
        esB ? tbB.innerHTML += html : tbA.innerHTML += html;
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

    let inasistentesNombres = [];
    let dAmigos = [];
    let nA = 0, nI = 0;
    let sumaLecBautizados = 0;
    let sumaLecAmigos = 0;

    integrantes.forEach((p, i) => {
        const asis = document.querySelector(`.check-asis[data-idx="${i}"]`).checked;
        const lec = parseInt(document.getElementById(`lec-${i}`).value) || 0;
        const esBautizado = p.Tipo && p.Tipo.toString().toLowerCase().includes("bautizado");

        if (asis) {
            nA++;
            if (esBautizado) sumaLecBautizados += lec;
            else sumaLecAmigos += lec;
        } else {
            nI++;
            inasistentesNombres.push(p.Nombres); // Solo guardamos nombres de faltas
        }

        // Migración a HOJA AMIGOS: Solo si NO es bautizado y tiene lección marcada
        if (!esBautizado && lec > 0) {
            dAmigos.push({ 
                nombre: p.Nombres, 
                leccionNum: lec, 
                fecha: new Date().toLocaleDateString() 
            });
        }
    });

    const porc = integrantes.length > 0 ? ((nA / integrantes.length) * 100).toFixed(0) + "%" : "0%";

    // Objeto consolidado para la hoja "Asist"
    const reporteAsist = {
        lider: lider,
        fecha: new Date().toLocaleDateString(),
        grupo: grupo,
        motivo: document.getElementById('motivo').value,
        nombresInasistentes: inasistentesNombres.join(", "), // Nombres en una sola fila
        sexoRelativo: "Mixto", 
        tipoRelativo: "Grupal",
        porc: porc,
        les: "S/. " + document.getElementById('totalLes').value,
        ofr: "S/. " + document.getElementById('totalOfrendas').value,
        nA: nA,
        nI: nI,
        nB: document.getElementById('numBautismo').value,
        lLES_Total: sumaLecBautizados,
        lBib_Total: sumaLecAmigos
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
