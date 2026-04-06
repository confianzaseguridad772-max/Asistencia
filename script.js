const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1ZqltAwmRogSs7b2Q41PfKV5FQrTt5_uaKtBL9rLLnE6FU-qecAY0wUNBHkLX7DeksQ/exec"; 
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
        const esB = p.Tipo && p.Tipo.includes("Bautizado");
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

    let dAsist = [], dAmigos = [], nA = 0, nI = 0;
    
    // Conteo para estadísticas
    integrantes.forEach((p, i) => {
        document.querySelector(`.check-asis[data-idx="${i}"]`).checked ? nA++ : nI++;
    });
    const porc = ((nA / integrantes.length) * 100).toFixed(0) + "%";

    integrantes.forEach((p, i) => {
        const asis = document.querySelector(`.check-asis[data-idx="${i}"]`).checked;
        const lec = document.getElementById(`lec-${i}`).value || 0;
        const esB = p.Tipo && p.Tipo.includes("Bautizado");

        if(!asis) { // Registro para "Asist" (solo inasistentes)
            dAsist.push({
                lider: lider, fecha: new Date().toLocaleDateString(), grupo: grupo,
                motivo: document.getElementById('motivo').value, nombre: p.Nombres,
                sexo: p.Sexo, tipo: p.Tipo, porc: porc,
                les: "S/. " + document.getElementById('totalLes').value,
                ofr: "S/. " + document.getElementById('totalOfrendas').value,
                nA: nA, nI: nI, nB: document.getElementById('numBautismo').value,
                lLES: esB ? lec : "", lBib: !esB ? lec : ""
            });
        }
        if(!esB && lec > 0) { // Registro para "Amigos" (progreso lecciones)
            dAmigos.push({ nombre: p.Nombres, leccionNum: lec, fecha: new Date().toLocaleDateString() });
        }
    });

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ destino: "ASISTENCIA", registrosAsist: dAsist, registrosAmigos: dAmigos })
    }).then(() => {
        document.getElementById('modalResumen').style.display = 'flex';
    }).catch(() => {
        alert("Error de conexión");
        btn.disabled = false;
    });
}
