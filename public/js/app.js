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