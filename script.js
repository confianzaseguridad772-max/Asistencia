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
// REEMPLAZA ESTA URL con el link de "Implementación" de tu Excel de Destino
const API_DESTINO = "https://script.google.com/macros/s/AKfycbxtyKC0jnGTZd-kS0uQiM7Aqw3bmoYDposuQgp2g_jlTox7aCGIE-RbDQVT0PvbINb2/exec";

function actualizarNombreGrupo() {
    const lider = document.getElementById("liderGp").value;
    document.getElementById("nombreGrupo").value = gruposMapping[lider] || "";
    if (lider) cargarIntegrantes(lider);
}

async function cargarIntegrantes(lider) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = "<p class='p-3 text-center'>Buscando en Padrón...</p>";
    aContainer.innerHTML = "";

    try {
        const response = await fetch(`${API_PADRON}?lider=${encodeURIComponent(lider)}`);
        const data = await response.json();
        renderizarLista(data);
    } catch (e) {
        console.error("Error:", e);
        bContainer.innerHTML = "<p class='p-3 text-danger'>Error al cargar integrantes.</p>";
    }
}

function renderizarLista(data) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = ""; aContainer.innerHTML = "";

    data.forEach((p) => {
        // Normalización de nombres de campos (Mayúsculas/Minúsculas)
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

// LÓGICA DE ENVÍO AL EXCEL (Sincronizado con tu función doPost)
document.getElementById("asistenciaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = "Enviando...";

    const liderGp = document.getElementById("liderGp").value;
    const nombreGrupo = document.getElementById("nombreGrupo").value;
    const semana = document.getElementById("semana").value;
    const motivo = document.getElementById("motivo").value;
    const inputs = document.querySelectorAll(".input-asistencia");

    const datosAsistencia = [];

    inputs.forEach(input => {
        let valorFinal;
        if (motivo === "Casas") {
            valorFinal = input.checked ? "SI" : "NO";
        } else {
            valorFinal = input.value || "0"; // Envía el número de Unidad
        }

        datosAsistencia.push({
            dni: input.dataset.dni,
            semana: semana, // Debe ser "Abril-1", etc.
            valor: valorFinal,
            liderGp: liderGp,
            nombreGrupo: nombreGrupo,
            nombreCompleto: input.dataset.nombre,
            sexo: input.dataset.sexo,
            tipo: input.dataset.tipo
        });
    });

    try {
        // Enviamos el JSON al Apps Script del Excel de Destino
        await fetch(API_DESTINO, {
            method: "POST",
            mode: "no-cors", // IMPORTANTE para evitar errores de CORS con Google Scripts
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosAsistencia)
        });

        alert("¡Registro enviado correctamente!");
    } catch (error) {
        console.error("Error al enviar:", error);
        alert("Error al enviar los datos.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Enviar Asistencia <i class='fas fa-paper-plane ms-2'></i>";
    }
});
