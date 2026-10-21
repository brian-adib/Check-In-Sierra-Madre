document.addEventListener('DOMContentLoaded', () => {
  // 1. TEMA OSCURO
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

  // 2. NAVEGACIÓN POR TABS
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('pageTitle');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('bg-blue-800'); b.classList.add('hover:bg-blue-800'); });
      btn.classList.add('bg-blue-800');
      btn.classList.remove('hover:bg-blue-800');
      
      tabContents.forEach(content => content.classList.add('hidden'));
      const targetTab = btn.getAttribute('data-tab');
      document.getElementById(`tab-${targetTab}`).classList.remove('hidden');
      
      const titles = { checkin: 'Check-in de Pasajeros', cabins: 'Gestión de Cabinas', status: 'Estado del Sistema' };
      pageTitle.textContent = titles[targetTab];
    });
  });

  // 3. FORMULARIO DE CHECK-IN (Simplificado)
  const checkinForm = document.getElementById('checkinForm');
  const messageContainer = document.getElementById('messageContainer');

  if (checkinForm) {
    checkinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageContainer.classList.add('hidden');
      
      const groupCode = document.getElementById('groupCode').value;

      try {
        const response = await fetch('/api/check-in/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupCode })
        });
        
        const data = await response.json();
        messageContainer.classList.remove('hidden');
        
        if (data.success) {
          localStorage.setItem('activeCheckInId', data.data.checkInIds[0]);
          
          messageContainer.className = 'mt-4 p-4 rounded border bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
          messageContainer.innerHTML = `<strong>¡Reserva encontrada!</strong><br>Pasajeros registrados. Ahora ve a la pestaña "Cabinas" para asignar una.`;
        } else {
          messageContainer.className = 'mt-4 p-4 rounded border bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
          let errorMsg = data.error.message;
          if (data.error.code === 'ERR_AGE_REQUIREMENT') errorMsg = 'Un menor de edad requiere viajar con al menos un adulto.';
          if (data.error.code === 'ERR_RESERVATION_NOT_FOUND') errorMsg = 'No se encontró ninguna reserva con ese código.';
          messageContainer.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
        }
      } catch (err) { console.error('Error de red:', err); }
    });
  }

  // 4. MAPA DE CABINAS Y ASIGNACIÓN
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
            <p class="text-xs uppercase opacity-80">Cubierta ${cabin.deck}</p>
            <p class="text-sm mt-2 font-medium">Ocupación: ${cabin.occupied}/${cabin.capacity}</p>
            <div class="mt-3 text-xs font-bold uppercase py-1 bg-white/30 rounded">${isFull ? 'Llena' : 'Disponible'}</div>
          `;
          
          if (!isFull) {
            div.addEventListener('click', async () => {
              const activeCheckInId = localStorage.getItem('activeCheckInId');
              if (!activeCheckInId) {
                alert('Primero debes buscar una reserva en la pestaña de Check-in.');
                return;
              }
              try {
                const res = await fetch('/api/check-in/cabin', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ checkInId: activeCheckInId, cabinId: cabin.id })
                });
                const data = await res.json();
                if (data.success) {
                  alert(`¡Cabina ${cabin.cabin_number} asignada con éxito!`);
                  loadCabins();
                } else {
                  alert(`Error: ${data.error.message}`);
                }
              } catch (err) { console.error(err); }
            });
          }
          cabinsGrid.appendChild(div);
        });
      }
    } catch (error) { console.error('Error al cargar cabinas:', error); }
  }

  const cabinsTabBtn = document.querySelector('[data-tab="cabins"]');
  if (cabinsTabBtn) cabinsTabBtn.addEventListener('click', loadCabins);
});