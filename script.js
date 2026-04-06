const indicadores = [
    "1. Sist. Lider", "2. Sist. Miembros", "3. Culto Alva", 
    "4. Sem. Oración", "5. Maranatha", "6. Santa Cena", 
    "7. Mi Talento", "8. Esc. Sabática", "9. Suscrito Lección"
];

const lideresRef = [
    {id: "Cherry", nombre: "1-Cherry"},
    {id: "Raquel", nombre: "2-Raquel"},
    {id: "Tito", nombre: "3-Tito"},
    {id: "Ricardo", nombre: "4-Ricardo"},
    {id: "Charito", nombre: "5-Rosario-Charito"},
    {id: "Pedro", nombre: "6-Pedro"},
    {id: "Erika", nombre: "7-Erika"},
    {id: "Jafet", nombre: "8-Jafet"},
    {id: "Gustabo", nombre: "9-Gustabo"}
];

const STORAGE_KEY = 'mipes_oficial';
let datos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || lideresRef.map(l => ({
    ...l, 
    checks: Array(indicadores.length).fill(false), 
    porcentaje: 0
}));

// Generar Checkboxes en la barra lateral
const grid = document.getElementById('grid-checks');
grid.innerHTML = indicadores.map((ind, i) => `
    <label class="check-item">
        <input type="checkbox" id="ind-${i}"> <span>${ind}</span>
    </label>
`).join('');

function renderizar() {
    const tbody = document.getElementById('body-tabla');
    tbody.innerHTML = datos.map(lider => {
        const celdas = lider.checks.map(c => 
            `<td><span class="status-pill ${c ? 'si' : 'no'}">${c ? 'SI' : 'NO'}</span></td>`
        ).join('');

        return `
            <tr>
                <td>
                    <div class="leader-cell">
                        <img src="img/${lider.id.toLowerCase()}.jpg" class="avatar" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${lider.nombre}&background=random'">
                        <span>${lider.nombre}</span>
                    </div>
                </td>
                ${celdas}
                <td class="text-right">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${lider.porcentaje}%"></div>
                    </div>
                    <div style="text-align:right; font-size:0.7rem; font-weight:bold; margin-top:4px">${lider.porcentaje}%</div>
                </td>
            </tr>
        `;
    }).join('');
}

// Guardar Datos
document.getElementById('form-registro').addEventListener('submit', (e) => {
    e.preventDefault();
    const idLider = document.getElementById('select-lider').value;
    if(!idLider) return;

    const nuevosChecks = indicadores.map((_, i) => document.getElementById(`ind-${i}`).checked);
    const totalSi = nuevosChecks.filter(Boolean).length;
    const porcentaje = ((totalSi / indicadores.length) * 100).toFixed(1);

    const idx = datos.findIndex(l => l.id === idLider);
    if (idx !== -1) {
        datos[idx].checks = nuevosChecks;
        datos[idx].porcentaje = porcentaje;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        renderizar();
        e.target.reset();
        alert('¡Actualizado con éxito!');
    }
});

// Función PDF Mejorada
document.getElementById('btn-pdf').addEventListener('click', () => {
    const elemento = document.getElementById('area-impresion');
    
    const opciones = {
        margin: [10, 10, 10, 10],
        filename: `MIPES_Reporte_2026.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opciones).from(elemento).save();
});

renderizar();