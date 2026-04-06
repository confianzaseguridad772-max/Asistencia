const URL = "https://script.google.com/macros/s/AKfycbydT4norXCFrbM3_VV0HqcqLvRhsvU88NDOo5z9CPlnq_Pz8rCOMzfhid8cAidr2L_0zA/exec"; 
let lista = [];

document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();

async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if(!lider) return;
    const r = await fetch(`${URL}?lider=${encodeURIComponent(lider)}`);
    lista = await r.json();
    const tbB = document.querySelector('#tabB tbody');
    const tbA = document.querySelector('#tabA tbody');
    tbB.innerHTML = ''; tbA.innerHTML = '';

    lista.forEach((p, i) => {
        const esB = p.Tipo.includes("Bautizado");
        const html = `<tr><td>${p.Nombres}</td><td align="right">
            <input type="number" id="lec-${i}" style="width:40px" placeholder="L">
            <input type="checkbox" class="check" data-idx="${i}">
        </td></tr>`;
        esB ? tbB.innerHTML += html : tbA.innerHTML += html;
    });
}

function marcarTodos(v) { document.querySelectorAll('.check').forEach(c => c.checked = v); }

function enviarReporte() {
    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.innerText = "Enviando...";

    let dAsis = [], dAmigos = [], nA = 0, nI = 0;
    lista.forEach((p, i) => {
        document.querySelector(`.check[data-idx="${i}"]`).checked ? nA++ : nI++;
    });

    const porc = ((nA / lista.length) * 100).toFixed(0) + "%";

    lista.forEach((p, i) => {
        const asis = document.querySelector(`.check[data-idx="${i}"]`).checked;
        const lec = document.getElementById(`lec-${i}`).value || 0;
        const esB = p.Tipo.includes("Bautizado");

        if(!asis) { // Inasistentes para "Asist"
            dAsist.push({
                lider: document.getElementById('liderGp').value, fecha: new Date().toLocaleDateString(),
                grupo: document.getElementById('nombreGrupo').value, motivo: document.getElementById('motivo').value,
                nombre: p.Nombres, sexo: p.Sexo, tipo: p.Tipo, porcentaje: porc,
                lesTotal: document.getElementById('totalLes').value, ofrenda: document.getElementById('totalOfr').value,
                nAsis: nA, nInasis: nI, bautismos: document.getElementById('nBaut').value,
                lecLES: esB ? lec : "", lecBib: !esB ? lec : ""
            });
        }
        if(!esB && lec > 0) { // Avances para "Amigos"
            dAmigos.push({ nombre: p.Nombres, leccionNum: lec, fecha: new Date().toLocaleDateString() });
        }
    });

    fetch(URL, {
        method: "POST", mode: "no-cors",
        body: JSON.stringify({ destino: "ASISTENCIA", registrosAsist: dAsist, registrosAmigos: dAmigos })
    }).then(() => document.getElementById('modal').style.display = 'flex');
}
