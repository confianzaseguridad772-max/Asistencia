const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeweVUPz6dSau8ut5toIBRhOmYiyND7PmlEF2UZvoW_Aztw7zGnCJSFwk4DxEZyS3QjA/exec"; // Reemplaza con tu URL de despliegue
let integrantes = [];

document.getElementById('fechaActual').innerText = "Fecha: " + new Date().toLocaleDateString();

async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if(!lider) return;
    try {
        const res = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        integrantes = await res.json();
        renderTablas();
    } catch(e) { alert("Error cargando integrantes"); }
}

function renderTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    tbB.innerHTML = ''; tbA.innerHTML = '';

    integrantes.forEach((p, i) => {
        const esB = p.Tipo.includes("Bautizado");
        const row = `<tr><td>${p.Nombres}</td><td style="text-align:right; display:flex; align-items:center; justify-content:flex-end">
            ${!esB ? `<select id="cur-${i}" class="curso-sel">
                <option>La Fe de Jesús</option><option>Yo Creo</option>
                <option>Daniel y Apocalipsis</option><option>Otro</option>
            </select>` : ''}
            <input type="number" id="lec-${i}" class="lec-input" placeholder="${esB?'0-7':'1-20'}">
            <input type="checkbox" class="check-asis" style="margin-left:10px" data-idx="${i}">
        </td></tr>`;
        esB ? tbB.innerHTML += row : tbA.innerHTML += row;
    });
}

function marcarBloque(v) { document.querySelectorAll('.check-asis').forEach(c => c.checked = v); }

function enviarDatos() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const grupo = document.getElementById('nombreGrupo').value;
    if(!lider || !grupo) return alert("Complete Líder y Nombre de Grupo");

    btn.disabled = true;
    btn.innerText = "Sincronizando...";

    let dAsist = [], dAmigos = [], nA = 0, nI = 0;
    integrantes.forEach((p, i) => {
        document.querySelector(`.check-asis[data-idx="${i}"]`).checked ? nA++ : nI++;
    });

    integrantes.forEach((p, i) => {
        const asis = document.querySelector(`.check-asis[data-idx="${i}"]`).checked;
        const lec = document.getElementById(`lec-${i}`).value || 0;
        const esB = p.Tipo.includes("Bautizado");

        if(!asis) { // SOLO INASISTENTES A HOJA "ASIST"
            dAsist.push({
                lider: lider, fecha: new Date().toLocaleDateString(), grupo: grupo,
                motivo: document.getElementById('motivo').value, nombre: p.Nombres,
                sexo: p.Sexo, tipo: p.Tipo,
                solesLes: "S/. " + document.getElementById('totalLes').value,
                solesOfr: "S/. " + document.getElementById('totalOfrendas').value,
                asistentes: nA, inasistentes: nI, bautismo: document.getElementById('numBautismo').value,
                lecLES: esB ? lec : "", lecBib: !esB ? lec : ""
            });
        }

        if(!esB && lec > 0) { // REGISTRO DE FECHA POR LECCIÓN EN HOJA "AMIGOS"
            dAmigos.push({ nombre: p.Nombres, leccionNum: lec, fecha: new Date().toLocaleDateString() });
        }
    });

    fetch(SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        body: JSON.stringify({ destino: "ASISTENCIA", registrosAsist: dAsist, registrosAmigos: dAmigos })
    }).then(() => {
        document.getElementById('modalResumen').style.display = 'flex';
    }).catch(() => {
        alert("Error de conexión");
        btn.disabled = false;
    });
}
