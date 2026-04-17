const gruposMapping = {
    "1-Cherry": "Amisadai",
    "2-Tito": "Amigos de sábado",
    "3-Ricardo": "Lirios del Valle",
    "4-Pedro": "sn",
    "5-Erika": "Embajadores de Cristo",
    "6-Jafet": "sn",
    "7-Gustabo": "sn"
};

const API_PADRON = "https://script.google.com/macros/s/AKfycbxsb8k8QKyWVsWOHn7dnH3dSDGRn3-mG7Kuk7SNAsdtyAwpInrBeIKjG8QBi42-tesioA/exec";
const API_DESTINO = "https://script.google.com/macros/s/AKfycbzY8dOhCLVf3Ar4pU4e9zcEQcKg0OIuwoljlT4OMVYvlXFe-U77kE991lOgPAw4guC3/exec";

function actualizarNombreGrupo() {
    const lider = document.getElementById("liderGp").value;
    document.getElementById("nombreGrupo").value = gruposMapping[lider] || "";
    if (lider) cargarIntegrantes(lider);
}

async function cargarIntegrantes(liderSeleccionado) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = "<p class='p-3 text-center'><i class='fas fa-spinner fa-spin'></i> Cargando lista de integrantes...</p>";
    aContainer.innerHTML = "";

    try {
        const response = await fetch(API_PADRON);
        const data = await response.json();
        renderizarLista(data, liderSeleccionado);
    } catch (e) {
        console.error("Error:", e);
        bContainer.innerHTML = "<p class='p-3 text-danger text-center'>Error al obtener datos del Padrón.</p>";
    }
}

function renderizarLista(data, liderSeleccionado) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = ""; 
    aContainer.innerHTML = "";

    // Filtrado por la columna "LíderGp" (manejando posibles variaciones de nombre)
    const filtrados = data.filter(p => {
        const valorLider = p.LíderGp || p.liderGp || p["Líder Gp"] || "";
        return valorLider.toString().trim() === liderSeleccionado.trim();
    });

    if (filtrados.length === 0) {
        bContainer.innerHTML = "<p class='p-3 text-muted text-center'>No hay personas registradas para este líder.</p>";
        return;
    }

    filtrados.forEach((p) => {
        const nombres = p.Nombres || p.nombres || "";
        const apellidos = p.Apellidos || p.apellidos || "";
        const dni = p.DNI || p.dni || "";
        const tipo = p.Tipo || p.tipo || "Amigo";
        const sexo = p.Sexo || p.sexo || "M";

        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between align-items-center p-3 border-bottom";
        item.innerHTML = `
            <div>
                <span class="fw-bold d-block text-uppercase">${apellidos}, ${nombres}</span>
                <small class="text-muted">DNI: ${dni}</small>
            </div>
            <div class="control-area">
                <input class="input-asistencia" 
                       data-dni="${dni}" 
                       data-nombre="${apellidos}, ${nombres}" 
                       data-sexo="${sexo}" 
                       data-tipo="${tipo}">
            </div>
        `;

        if (tipo.toLowerCase().includes("bautizado")) bContainer.appendChild(item);
        else aContainer.appendChild(item);
    });
    toggleInputs();
}

function toggleInputs() {
    const motivo = document.getElementById("motivo").value;
    const inputs = document.querySelectorAll(".input-asistencia");
    inputs.forEach(input => {
        if (motivo === "Casas") {
            input.type = "checkbox";
            input.className = "form-check-input input-asistencia";
            input.style.width = "28px";
            input.style.height = "28px";
        } else {
            input.type = "number";
            input.className = "form-control form-control-sm input-asistencia text-center";
            input.style.width = "65px";
            input.placeholder = "0";
        }
    });
}

document.getElementById("asistenciaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Enviando...";

    const liderGp = document.getElementById("liderGp").value;
    const nombreGrupo = document.getElementById("nombreGrupo").value;
    const semana = document.getElementById("semana").value;
    const motivo = document.getElementById("motivo").value;
    const inputs = document.querySelectorAll(".input-asistencia");

    const datosAsistencia = [];

    inputs.forEach(input => {
        let valorFinal = (motivo === "Casas") ? (input.checked ? "SI" : "NO") : (input.value || "0");

        datosAsistencia.push({
            dni: input.dataset.dni,
            semana: semana,
            valor: valorFinal,
            liderGp: liderGp,
            nombreGrupo: nombreGrupo,
            nombreCompleto: input.dataset.nombre,
            sexo: input.dataset.sexo,
            tipo: input.dataset.tipo,
            motivo: motivo
        });
    });

    try {
        await fetch(API_DESTINO, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            body: JSON.stringify(datosAsistencia)
        });
        alert("¡Registro enviado con éxito a la hoja " + motivo + "!");
    } catch (error) {
        alert("Error de conexión al enviar.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Enviar Asistencia <i class='fas fa-paper-plane ms-2'></i>";
    }
});
