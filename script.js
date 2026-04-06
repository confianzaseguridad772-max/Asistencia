const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1ZqltAwmRogSs7b2Q41PfKV5FQrTt5_uaKtBL9rLLnE6FU-qecAY0wUNBHkLX7DeksQ/exec"; // ¡IMPORTANTE: CAMBIA ESTO!
let listaGlobal = [];

document.getElementById('fechaHoy').innerText = new Date().toLocaleDateString();

// Función para traer integrantes de Google Sheets
async function obtenerIntegrantes() {
    const lider = document.getElementById('selLider').value;
    if(!lider) return;
    
    try {
        const resp = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaGlobal = await resp.json();
        
        const tbB = document.querySelector('#tabBautizados tbody');
        const tbA = document.querySelector('#tabAmigos tbody');
        tbB.innerHTML = ''; tbA.innerHTML = '';

        listaGlobal.forEach((p, i) => {
            const esB = p.Tipo.includes("Bautizado");
            const html = `<tr><td>${p.Nombres}</td><td align="right">
                <input type="number" id="lec-${i}" style="width:45px" placeholder="Lec">
                <input type="checkbox" class="chk-asis" data-idx="${i}">
            </td></tr>`;
            esB ? tbB.innerHTML += html : tbA.innerHTML += html;
        });
    } catch(e) { alert("Error al cargar lista"); }
}

function marcarTodos(v) { document.querySelectorAll('.chk-asis').forEach(c => c.checked = v); }

async function procesarEnvio() {
    const lider = document.getElementById('selLider').value;
    const grupo = document.getElementById('inpGrupo').value;
    if(!lider || !grupo) return alert("Complete Líder y Grupo");

    document.getElementById('loading').style.display = 'flex';
    
    let dAsist = [], dAmigos = [], nA = 0, nI = 0;
    listaGlobal.forEach((p, i) => {
        document.querySelector(`.chk-asis[data-idx="${i}"]`).checked ? nA++ : nI++;
    });

    const porc = ((nA / listaGlobal.length) * 100).toFixed(0) + "%";

    listaGlobal.forEach((p, i) => {
        const asis = document.querySelector(`.chk-asis[data-idx="${i}"]`).checked;
        const lec = document.getElementById(`lec-${i}`).value || 0;
        const esB = p.Tipo.includes("Bautizado");

        if(!asis) { // Si NO asistió, va a la hoja Asist
            dAsist.push({
                lider: lider, fecha: new Date().toLocaleDateString(), grupo: grupo, motivo: "Sabatica",
                nombre: p.Nombres, sexo: p.Sexo, tipo: p.Tipo, porc: porc,
                les: document.getElementById('inpLes').value, ofr: document.getElementById('inpOfr').value,
                nA: nA, nI: nI, nB: document.getElementById('inpBaut').value,
                lLES: esB ? lec : "", lBib: !esB ? lec : ""
            });
        }
        if(!esB && lec > 0) { // Si es Amigo y tiene lección, actualiza Amigos
            dAmigos.push({ nombre: p.Nombres, leccionNum: lec, fecha: new Date().toLocaleDateString() });
        }
    });

    await fetch(SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        body: JSON.stringify({ destino: "ASISTENCIA", registrosAsist: dAsist, registrosAmigos: dAmigos })
    });

    alert("¡Reporte Enviado!");
    location.reload();
}
