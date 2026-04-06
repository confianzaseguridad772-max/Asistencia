const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzib9tCY-tH3yGtOKEzOeL6v1T4MjyGn0QnTYYNL0vHCQNNssdZb47pnykdzvGsS7OJFA/exec";
let listaIntegrantes = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fechaActual').innerText = new Date().toLocaleDateString();
});

async function cargarLista() {
    const lider = document.getElementById('liderGp').value;
    if (!lider) return;
    
    document.querySelector('#tablaBautizados tbody').innerHTML = "<tr><td colspan='2' class='empty-state'>Cargando...</td></tr>";
    document.querySelector('#tablaAmigos tbody').innerHTML = "<tr><td colspan='2' class='empty-state'>Cargando...</td></tr>";

    try {
        const res = await fetch(`${SCRIPT_URL}?lider=${encodeURIComponent(lider)}`);
        listaIntegrantes = await res.json();
        renderizarTablas();
    } catch (e) { alert("Error al cargar datos"); }
}

function renderizarTablas() {
    const tbB = document.querySelector('#tablaBautizados tbody');
    const tbA = document.querySelector('#tablaAmigos tbody');
    tbB.innerHTML = ''; tbA.innerHTML = '';

    listaIntegrantes.forEach((p, i) => {
        const html = `<tr><td>${p.Nombres}</td><td class="txt-right">
            <input type="number" step="0.1" id="monto-${i}" placeholder="0.00" class="cuota-input">
            <input type="checkbox" class="asis-check" data-index="${i}">
        </td></tr>`;
        (p.Tipo && p.Tipo.trim().toLowerCase().includes("bautizado")) ? tbB.innerHTML += html : tbA.innerHTML += html;
    });
}

function marcarBloque(val) {
    document.querySelectorAll('.asis-check').forEach(c => c.checked = val);
}

function enviarAsistencia() {
    const btn = document.getElementById('btnEnviar');
    const lider = document.getElementById('liderGp').value;
    const grupo = document.getElementById('nombreGrupo').value;
    
    if (!lider || !grupo) return alert("Complete los datos requeridos");

    btn.disabled = true;
    btn.innerText = "Enviando...";

    let totales = { B: 0, A: 0 }, asis = { B: 0, A: 0 }, soles = 0, registros = [];
    
    listaIntegrantes.forEach((p, i) => {
        let esB = (p.Tipo && p.Tipo.trim().toLowerCase().includes("bautizado"));
        esB ? totales.B++ : totales.A++;
        
        const chk = document.querySelector(`.asis-check[data-index="${i}"]`);
        if (chk && chk.checked) {
            esB ? asis.B++ : asis.A++;
            const m = parseFloat(document.getElementById(`monto-${i}`).value) || 0;
            soles += m;
            registros.push({
                liderGp: lider, fecha: new Date().toLocaleDateString(), nombreGrupo: grupo,
                motivo: document.getElementById('motivo').value, nombre: p.Nombres, 
                sexo: p.Sexo, tipo: p.Tipo, tipoRef: esB ? "B" : "A", soles: "S/. " + m.toFixed(2)
            });
        }
    });

    const pB = totales.B > 0 ? ((asis.B / totales.B) * 100).toFixed(1) : 0;
    const pA = totales.A > 0 ? ((asis.A / totales.A) * 100).toFixed(1) : 0;

    registros.forEach(r => r.porcentajeAsis = (r.tipoRef === "B" ? pB : pA) + "%");

    fetch(SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        body: JSON.stringify({ destino: "ASISTENCIA", registros: registros })
    }).then(() => {
        document.getElementById('resumenBautizados').innerText = `${asis.B} de ${totales.B} (${pB}%)`;
        document.getElementById('resumenAmigos').innerText = `${asis.A} de ${totales.A} (${pA}%)`;
        document.getElementById('resumenTotal').innerText = `S/. ${soles.toFixed(2)}`;
        document.getElementById('modalResumen').style.display = 'flex';
    }).catch(() => {
        alert("Error al guardar");
        btn.disabled = false;
        btn.innerText = "Guardar Registro";
    });
}
