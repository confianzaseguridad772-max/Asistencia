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
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    
    bContainer.innerHTML = "<div class='p-3 text-center text-muted'>Cargando integrantes...</div>";
    aContainer.innerHTML = "";

    try {
        const response = await fetch(`${API_PADRON}?lider=${encodeURIComponent(lider)}`);
        const data = await response.json();
        renderizarLista(data);
    } catch (e) {
        console.error("Error cargando integrantes", e);
        bContainer.innerHTML = "<div class='p-3 text-danger'>Error al conectar con el Padrón</div>";
    }
}

function renderizarLista(data) {
    const bContainer = document.getElementById("listaBautizados");
    const aContainer = document.getElementById("listaAmigos");
    bContainer.innerHTML = ""; 
    aContainer.innerHTML = "";

    if (!data || data.length === 0) {
        bContainer.innerHTML = "<div class='p-3 text-muted'>No hay datos para este líder</div>";
        return;
    }

    data.forEach((p) => {
        // CORRECCIÓN: Usamos operadores OR (||) para capturar tanto Mayúsculas como Minúsculas
        const nombres = p.Nombres || p.nombres || "Sin Nombre";
        const apellidos = p.Apellidos || p.apellidos || "";
        const dni = p.DNI || p.dni || "S/D";
        const tipo = p.Tipo || p.tipo || "Amigo";
        const sexo = p.Sexo || p.sexo || "-";
        const celular = p.Celular || p.celular || "-";

        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between align-items-center p-3 border-bottom";
        
        item.innerHTML = `
            <div>
                <span class="fw-bold d-block text-uppercase" style="font-size: 0.9rem;">${apellidos}, ${nombres}</span>
                <small class="text-muted text-uppercase">${tipo} | DNI: ${dni}</small>
            </div>
            <div class="control-area">
                <input class="input-asistencia shadow-sm" 
                       data-dni="${dni}" 
                       data-nombre="${nombres} ${apellidos}" 
                       data-tipo="${tipo}"
                       data-sexo="${sexo}"
                       data-celular="${celular}">
            </div>
        `;

        // Filtramos por tipo para separar en los dos módulos
        if (tipo.toLowerCase().includes("bautizado")) {
            bContainer.appendChild(item);
        } else {
            aContainer.appendChild(item);
        }
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
            input.placeholder = "0";
            input.min = "1";
            input.max = "7";
            input.className = "form-control form-control-sm input-asistencia text-center";
            input.style.width = "60px";
        }
    });
}

// Función para enviar los datos al segundo Excel
document.getElementById("asistenciaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const lider = document.getElementById("liderGp").value;
    const nombreGrupo = document.getElementById("nombreGrupo").value;
    const motivo = document.getElementById("motivo").value;
    const semana = document.getElementById("semana").value;
    const inputs = document.querySelectorAll(".input-asistencia");
    
    const asistencias = [];
    
    inputs.forEach(input => {
        let valor;
        if (motivo === "Casas") {
            valor = input.checked ? "SI" : "NO";
        } else {
            valor = input.value || "0";
        }
        
        asistencias.push({
            liderGp: lider,
            nombreGrupo: nombreGrupo,
            dni: input.dataset.dni,
            nombreCompleto: input.dataset.nombre,
            sexo: input.dataset.sexo,
            celular: input.dataset.celular,
            tipo: input.dataset.tipo,
            semana: semana,
            valor: valor,
            motivo: motivo
        });
    });

    // Enviar a Google Apps Script Destino
    try {
        const res = await fetch(API_DESTINO, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(asistencias)
        });
        alert("¡Asistencia enviada con éxito!");
    } catch (err) {
        alert("Error al enviar: " + err);
    }
});
