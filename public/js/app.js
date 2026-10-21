// ==========================================
// 1. LÓGICA DEL TEMA OSCURO
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// ==========================================
// 2. LÓGICA DE NAVEGACIÓN POR PESTAÑAS (TABS)
// ==========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 1. Quitar la clase activa a todos los botones
    tabBtns.forEach(b => {
      b.classList.remove('bg-blue-800');
      b.classList.add('hover:bg-blue-800');
    });
    // 2. Poner la clase activa al botón clickeado
    btn.classList.add('bg-blue-800');
    btn.classList.remove('hover:bg-blue-800');

    // 3. Ocultar todos los contenidos
    tabContents.forEach(content => content.classList.add('hidden'));

    // 4. Mostrar el contenido correspondiente
    const targetTab = btn.getAttribute('data-tab');
    document.getElementById(`tab-${targetTab}`).classList.remove('hidden');

    // 5. Actualizar el título del Header
    const titles = {
      checkin: 'Check-in de Pasajeros',
      cabins: 'Gestión de Cabinas',
      status: 'Estado del Sistema'
    };
    pageTitle.textContent = titles[targetTab];
  });
});
// ==========================================
// 3. LÓGICA DEL FORMULARIO DE CHECK-IN
// ==========================================
const checkinForm = document.getElementById('checkinForm');
const passengersContainer = document.getElementById('passengersContainer');
const addPassengerBtn = document.getElementById('addPassengerBtn');
const messageContainer = document.getElementById('messageContainer');

// Función para crear los inputs de un pasajero
function createPassengerInput() {
  const div = document.createElement('div');
  div.className = 'passenger-row grid grid-cols-2 gap-2 border border-gray-200 dark:border-gray-700 p-3 rounded';
  div.innerHTML = `
    <input type="text" class="doc w-full border p-1 rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Documento (DNI)" required>
    <input type="text" class="fname w-full border p-1 rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Nombre" required>
    <input type="text" class="lname w-full border p-1 rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Apellido" required>
    <input type="date" class="dob w-full border p-1 rounded dark:bg-gray-700 dark:border-gray-600" required title="Fecha de nacimiento">
  `;
  return div;
}

// Agregar el primer pasajero por defecto
passengersContainer.appendChild(createPassengerInput());

// Botón para agregar más pasajeros
addPassengerBtn.addEventListener('click', () => {
  passengersContainer.appendChild(createPassengerInput());
});

// Manejar el envío del formulario
checkinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageContainer.classList.add('hidden');
  
  const groupCode = document.getElementById('groupCode').value;
  const rows = document.querySelectorAll('.passenger-row');
  
  // Construir el arreglo de pasajeros
  const passengers = Array.from(rows).map(row => ({
    documentType: 'DNI',
    documentNumber: row.querySelector('.doc').value,
    firstName: row.querySelector('.fname').value,
    lastName: row.querySelector('.lname').value,
    birthDate: row.querySelector('.dob').value,
    isVip: false
  }));

  try {
    // Llamada a nuestra API Real
    const response = await fetch('/api/check-in/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupCode, passengers })
    });
    
    const data = await response.json();
    
    messageContainer.classList.remove('hidden');
    
    if (data.success) {
      // UI de Éxito (en español)
      messageContainer.className = 'mt-4 p-4 rounded border bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      messageContainer.innerHTML = `<strong>¡Check-in iniciado!</strong><br>ID del Grupo: ${data.data.groupId}<br><small>Los pasajeros han sido registrados.</small>`;
      checkinForm.reset();
      passengersContainer.innerHTML = '';
      passengersContainer.appendChild(createPassengerInput());
    } else {
      // UI de Error (Traducimos el error interno)
      messageContainer.className = 'mt-4 p-4 rounded border bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      let errorMsg = data.error.message;
      if (data.error.code === 'ERR_AGE_REQUIREMENT') {
        errorMsg = 'Un menor de edad requiere viajar con al menos un adulto.';
      }
      messageContainer.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
    }
  } catch (err) {
    console.error('Error de red:', err);
  }
});