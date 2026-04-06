let integrantesData = [];

function cargarLista() {
  const lider = document.getElementById('liderGp').value;
  if (!lider) return;
  
  // Llama a la función del servidor en Google Apps Script
  google.script.run.withSuccessHandler(function(data) {
    integrantesData = data;
    renderizarTablas();
  }).getIntegrantes(lider);
}

function renderizarTablas() {
  const tbodyB = document.querySelector('#tablaBautizados tbody');
  const tbodyA = document.querySelector('#tablaAmigos tbody');
  tbodyB.innerHTML = '';
  tbodyA.innerHTML = '';

  integrantesData.forEach((persona, index) => {
    const row = `<tr>
      <td>${persona.nombreCompleto}</td>
      <td style="text-align:center"><input type="checkbox" class="chk-asistencia" data-index="${index}"></td>
    </tr>`;
    
    if (persona.tipo === "Bautizado") {
      tbodyB.innerHTML += row;
    } else {
      tbodyA.innerHTML += row;
    }
  });
}

function marcarTodos(estado) {
  document.querySelectorAll('.chk-asistencia').forEach(chk => chk.checked = estado);
}

function enviarDatos() {
  const btn = document.getElementById('btnEnviar');
  const lider = document.getElementById('liderGp').value;
  const nombreGrupo = document.getElementById('nombreGrupo').value;
  const motivo = document.getElementById('motivo').value;

  if(!lider || !nombreGrupo) {
    alert("Por favor rellene el Líder y Nombre del Grupo");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Registrando...";

  const fecha = new Date().toLocaleDateString();
  const checkboxes = document.querySelectorAll('.chk-asistencia');
  
  let registroFinal = [];
  let conteo = { 
    "Bautizado": { total: 0, asis: 0 }, 
    "Amigos de Esperanza": { total: 0, asis: 0 } 
  };

  // Primero contamos totales para el porcentaje
  integrantesData.forEach(p => {
    if (conteo[p.tipo]) conteo[p.tipo].total++;
  });

  // Procesamos marcados
  checkboxes.forEach(chk => {
    const idx = chk.dataset.index;
    const p = integrantesData[idx];
    if (chk.checked) {
      conteo[p.tipo].asis++;
      registroFinal.push({
        liderGp: lider,
        fecha: fecha,
        nombreGrupo: nombreGrupo,
        motivo: motivo,
        nombre: p.nombreCompleto,
        sexo: p.sexo,
        tipo: p.tipo
      });
    }
  });

  // Añadimos el % calculado a cada registro
  registroFinal.forEach(reg => {
    const totalTipo = conteo[reg.tipo].total;
    const asistTipo = conteo[reg.tipo].asis;
    reg.porcentajeAsis = ((asistTipo / totalTipo) * 100).toFixed(2) + "%";
  });

  google.script.run.withSuccessHandler(function(res) {
    alert(res);
    location.reload();
  }).registrarAsistencia(registroFinal);
}
