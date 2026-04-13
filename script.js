const gruposMapping = {
    "1-Cherry": "Angles",
    "2-Tito": "Amistades",
    "3-Ricardo": "Orquideas",
    "4-Pedro": "Candados",
    "5-Erika": "Adolescentes",
    "6-Jafet": "Ven",
    "7-Gustabo": "Poloto"
};

const API_PADRON = "https://script.google.com/macros/s/AKfycbxsb8k8QKyWVsWOHn7dnH3dSDGRn3-mG7Kuk7SNAsdtyAwpInrBeIKjG8QBi42-tesioA/exec";
const API_DESTINO = "https://script.google.com/macros/s/AKfycbxKepoHm7LFSG1cOmtngN5qB9y25yW6v21lTzCcT7esXyKpGCeR76HXuAkzcUxnU2d2/exec";

function actualizarNombreGrupo() {
    const lider = document.getElementById("liderGp").value;
    document.getElementById("nombreGrupo").value = gruposMapping[lider] || "";
    if (lider) cargarIntegrantes(lider);
}

async function cargarIntegrantes(lider) {
    // Simulación de carga (Aquí se conecta al link de Padron)
    // Se asume que el script de Padron devuelve un JSON con {nombres, apellidos, tipo, dni, sexo, celular}
    try {
        const response = await fetch(`${API_PADRON}?lider=${lider}`);
        const data = await response.json();
        renderizarLista(data);
    } catch (e) {
        console.error("Error cargando integrantes", e);
    }
}

function toggleInputs() {
    const motivo = document.getElementById("motivo").value;
    const inputs = document.querySelectorAll(".input-asistencia");
    inputs.forEach(input => {
        if (motivo === "Casas") {
            input.type = "checkbox";
            input.className = "form-check-input input-asistencia";
        } else {
            input.type = "number";
            input.placeholder = "1-7";
            input.min = "1";
            input.max = "7";
            input.className = "form-control form-control-sm input-asistencia w-25";
        }
    });
}

function renderizarLista(data) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = ""; aContainer.innerHTML = "";

    data.forEach((p, index) => {
        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between align-items-center p-3";
        item.innerHTML = `
            <div>
                <span class="fw-medium">${p.apellidos}, ${p.nombres}</span>
                <small class="d-block text-muted">DNI: ${p.dni}</small>
            </div>
            <div class="control-area">
                <input data-dni="${p.dni}" data-tipo="${p.tipo}" class="input-asistencia">
            </div>
        `;
        if (p.tipo === "Bautizado") bContainer.appendChild(item);
        else aContainer.appendChild(item);
    });
    toggleInputs();
}
