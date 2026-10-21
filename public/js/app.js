// ==========================================
// LÓGICA DEL FRONTEND (Navegador)
// ==========================================

// Lógica para alternar el tema oscuro (Dark Mode)
const themeToggleBtn = document.getElementById('themeToggle');

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    // Verifica si la etiqueta <html> ya tiene la clase 'dark'
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Guarda la preferencia
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Guarda la preferencia
    }
  });
}