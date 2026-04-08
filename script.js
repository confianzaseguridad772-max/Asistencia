// --- CONFIGURACIÓN ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwaOlN1Alza9Ka5_e7S1Hq2itAXFEnR3aui5p33x7wxv30Gl-s7aQFEltm1dm0VbFURXA/exec"; // Asegúrate de poner tu URL aquí

// --- FUNCIÓN PARA ENVIAR ASISTENCIA (Módulo Amigos, Unidad, Hogares) ---
async function enviarAsistencia() {
    const btn = document.getElementById("btnEnviarAsist");
    btn.disabled = true;
    btn.innerText = "Enviando...";

    // Captura de datos básicos del reporte
    const lider = document.getElementById("liderGp").value;
    const fecha = document.getElementById("fechaAsist").value; // Formato YYYY-MM-DD
    const grupo = document.getElementById("nombreGrupo").value;
    const motivo = document.getElementById("motivoAsist").value;
    
    // Captura de datos específicos de Amigos de Esperanza (N° 1 al 20)
    const numeroAmigo = document.getElementById("numAmigo") ? document.getElementById("numAmigo").value : "";

    // Captura de los registros de personas marcadas en el formulario
    const filas = document.querySelectorAll(".fila-asistencia");
    let registros = [];

    filas.forEach(fila => {
        const checkbox = fila.querySelector(".check-asist");
        if (checkbox && checkbox.checked) {
            registros.push({
                dni: fila.dataset.dni,
                nombre: fila.dataset.nombre,
                tipo: fila.dataset.tipo,
                sexo: fila.dataset.sexo,
                leccionNum: fila.querySelector(".select-leccion") ? fila.querySelector(".select-leccion").value : "",
                nB: numeroAmigo // Este es el dato clave que pides para las columnas N°1, N°2...
            });
        }
    });

    const payload = {
        destino: "ASISTENCIA",
        reporteAsist: {
            lider: lider,
            fecha: fecha,
            grupo: grupo,
            motivo: motivo,
            nB: numeroAmigo, // Se envía también en el encabezado del reporte
            les: document.getElementById("lesAsist") ? document.getElementById("lesAsist").value : "",
            ofr: document.getElementById("ofrAsist") ? document.getElementById("ofrAsist").value : ""
        },
        registros: registros
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Importante para evitar bloqueos de CORS con Google Scripts
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        alert("Asistencia enviada con éxito a la hoja " + motivo);
        location.reload(); 
    } catch (error) {
        console.error("Error:", error);
        alert("Error al enviar: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Asistencia";
    }
}

// --- FUNCIÓN PARA REGISTRO EN PADRÓN (Nuevo Integrante) ---
async function registrarPadron(event) {
    event.preventDefault();
    const btn = document.getElementById("btnRegistrar");
    btn.disabled = true;

    const data = {
        destino: "PADRON",
        DNI: document.getElementById("dni").value,
        Nombres: document.getElementById("nombres").value,
        ApPaterno: document.getElementById("apPaterno").value,
        ApMaterno: document.getElementById("apMaterno").value,
        fechaNac: document.getElementById("fechaNac").value,
        Sexo: document.getElementById("sexo").value,
        Celular: document.getElementById("celular").value,
        Direccion: document.getElementById("direccion").value,
        Tipo: document.getElementById("tipoPersona").value,
        LiderGp: document.getElementById("liderResponsable").value
    };

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(data)
        });
        alert("Registrado correctamente en el Padrón");
        document.getElementById("formPadron").reset();
    } catch (error) {
        alert("Error en el registro");
    } finally {
        btn.disabled = false;
    }
}
