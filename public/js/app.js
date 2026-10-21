// ==========================================
// INICIALIZACIÓN DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

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
      // Resetear estilos de botones
      tabBtns.forEach(b => {
        b.classList.remove('bg-blue-800');
        b.classList.add('hover:bg-blue-800');
      });
      btn.classList.add('bg-blue-800');
      btn.classList.remove('hover:bg-blue-800');

      // Ocultar todos los contenidos y mostrar el seleccionado
      tabContents.forEach(content => content.classList.add('hidden'));
      const targetTab = btn.getAttribute('data-tab');
      document.getElementById(`tab-${targetTab}`).classList.remove('hidden');

      // Actualizar título del header
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

  // Función para crear un bloque de inputs para un pasajero
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

  // Agregar el primer pasajero al cargar la página
  if (passengersContainer) {
    passengersContainer.appendChild(createPassengerInput());
  }

  // Botón para agregar más pasajeros
  if (addPassengerBtn) {
    addPassengerBtn.addEventListener('click', () => {
      passengersContainer.appendChild(createPassengerInput());
    });
  }

  // Envío del formulario
  if (checkinForm) {
    checkinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageContainer.classList.add('hidden');
      
      const groupCode = document.getElementById('groupCode').value;
      const rows = document.querySelectorAll('.passenger-row');
      
      const passengers = Array.from(rows).map(row => ({
        documentType: 'DNI',
        documentNumber: row.querySelector('.doc').value,
        firstName: row.querySelector('.fname').value,
        lastName: row.querySelector('.lname').value,
        birthDate: row.querySelector('.dob').value,
        isVip: false
      }));

      try {
        const response = await fetch('/api/check-in/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupCode, passengers })
        });
        
        const data = await response.json();
        messageContainer.classList.remove('hidden');
        
        if (data.success) {
          // GUARDAMOS EL ID EN LOCALSTORAGE PARA USARLO EN EL MAPA DE CABINAS
          localStorage.setItem('activeCheckInId', data.data.checkInIds[0]);
          
          messageContainer.className = 'mt-4 p-4 rounded border bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
          messageContainer.innerHTML = `<strong>¡Check-in iniciado!</strong><br>Ahora ve a la pestaña "Cabinas" para asignar una.`;
          
          checkinForm.reset();
          passengersContainer.innerHTML = '';
          passengersContainer.appendChild(createPassengerInput());
        } else {
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
  }

  // ==========================================
  // 4. LÓGICA DE MAPAS VISUALES Y ASIGNACIÓN
  // ==========================================
  const cabinsGrid = document.getElementById('cabinsGrid');

  async function loadCabins() {
    if (!cabinsGrid) return;
    try {
      const response = await fetch('/api/check-in/cabins');
      const result = await response.json();
      
      if (result.success) {
        cabinsGrid.innerHTML = '';
        
        result.data.forEach(cabin => {
          const isFull = cabin.occupied >= cabin.capacity;
          
          const colorClass = isFull 
            ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700' 
            : 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700 hover:ring-2 hover:ring-green-500 cursor-pointer';
          
          const div = document.createElement('div');
          div.className = `border p-4 rounded-lg text-center transition ${colorClass}`;
          div.innerHTML = `
            <h4 class="font-bold text-2xl">${cabin.cabin_number}</h4>
            <p class="text-xs uppercase tracking-wide opacity-80">Cubierta ${cabin.deck}</p>
            <p class="text-sm mt-2 font-medium">Ocupación: ${cabin.occupied}/${cabin.capacity}</p>
            <div class="mt-3 text-xs font-bold uppercase py-1 bg-white/30 rounded">
              ${isFull ? 'Llena' : 'Disponible'}
            </div>
          `;
          
          if (!isFull) {
            div.addEventListener('click', async () => {
              const activeId = localStorage.getItem('activeCheckInId');
              
              if (!activeId) {
                alert('Por favor, primero completa el formulario de Check-in en la otra pestaña.');
                return;
              }

              try {
                const res = await fetch('/api/check-in/cabin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ checkInId: activeId, cabinId: cabin.id })
                });
                
                const data = await res.json();
                
                if (data.success) {
                  alert(`¡Cabina ${cabin.cabin_number} asignada con éxito!`);
                  loadCabins(); // Recargar el mapa para ver la nueva ocupación
                } else {
                  alert(`Error: ${data.error.message}`);
                }
              } catch (err) {
                console.error('Error al asignar cabina:', err);
              }
            });
          }
          
          cabinsGrid.appendChild(div);
        });
      }
    } catch (error) {
      console.error('Error al cargar cabinas:', error);
    }
  }

  // Cargar las cabinas cada vez que se hace clic en la pestaña
  const cabinsTabBtn = document.querySelector('[data-tab="cabins"]');
  if (cabinsTabBtn) {
    cabinsTabBtn.addEventListener('click', loadCabins);
  }

});