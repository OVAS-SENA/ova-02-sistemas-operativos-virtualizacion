/**
 * SENA OVA Application Framework
 * Controlador de navegación, interfaz y accesibilidad
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar SCORM
  if (typeof ScormConnector !== 'undefined') {
    ScormConnector.init();
  }

  // Elementos de la UI
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const progressBar = document.querySelector('.global-progress-bar');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const visitedSections = new Set(['intro']);

  // Control de Tema (Oscuro / Claro)
  function initTheme() {
    const savedTheme = localStorage.getItem('sena_ova_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sena_ova_theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    initTheme();
  }

  // Toggle Menú Móvil
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Cerrar sidebar al hacer click afuera en móviles
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 992 && 
          !sidebar.contains(e.target) && 
          !menuToggle.contains(e.target) && 
          sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Navegación por Secciones
  function navigateTo(sectionId) {
    let targetSection = document.getElementById(sectionId);
    if (!targetSection) {
      console.warn(`Sección #${sectionId} no encontrada.`);
      return;
    }

    // Actualizar secciones
    sections.forEach(sec => sec.classList.remove('active'));
    targetSection.classList.add('active');

    // Actualizar items de menú
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === sectionId) {
        item.classList.add('active');
        item.classList.add('completed');
      } else {
        item.classList.remove('active');
      }
    });

    visitedSections.add(sectionId);
    updateProgress();

    // Cerrar sidebar en móviles
    if (sidebar && window.innerWidth <= 992) {
      sidebar.classList.remove('open');
    }

    // Scroll arriba suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      navigateTo(target);
    });
  });

  // Botones de Anterior y Siguiente
  document.querySelectorAll('.btn-pager').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) navigateTo(target);
    });
  });

  // Cálculo de Progreso
  function updateProgress() {
    if (!progressBar) return;
    const totalSections = sections.length;
    const visitedCount = visitedSections.size;
    const percentage = Math.min(100, Math.round((visitedCount / totalSections) * 100));
    progressBar.style.width = `${percentage}%`;
  }

  // Acordeones Interactivos
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isAlreadyActive = item.classList.contains('active');

      // Opcional: cerrar los demás
      const parent = item.parentElement;
      if (parent.classList.contains('accordion-single')) {
        parent.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      }

      item.classList.toggle('active', !isAlreadyActive);
    });
  });

  // Botón Copiar en Terminales
  document.querySelectorAll('.terminal-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const terminalBody = btn.closest('.terminal-box').querySelector('.terminal-body');
      const textToCopy = terminalBody.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ ¡Copiado!';
        btn.style.background = 'var(--sena-green)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 2000);
      });
    });
  });

  // Glosario con Búsqueda en Tiempo Real
  const glossaryInput = document.getElementById('glossarySearch');
  if (glossaryInput) {
    glossaryInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.glossary-item').forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(term) ? 'block' : 'none';
      });
    });
  }

  // Lightbox Modal para Fotografías
  const photoWrappers = document.querySelectorAll('.photo-wrapper');
  if (photoWrappers.length > 0) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 900px; text-align: center;">
        <button class="modal-close">&times;</button>
        <img id="modalImg" src="" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;" />
        <p id="modalCaption" style="margin-top: 14px; font-size: 0.95rem; color: var(--text-secondary);"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    const modalImg = overlay.querySelector('#modalImg');
    const modalCaption = overlay.querySelector('#modalCaption');
    const closeBtn = overlay.querySelector('.modal-close');

    photoWrappers.forEach(wrap => {
      wrap.addEventListener('click', () => {
        const img = wrap.querySelector('img');
        const caption = wrap.closest('.photo-card')?.querySelector('.photo-caption')?.innerText || '';
        if (img) {
          modalImg.src = img.src;
          modalCaption.innerText = caption;
          overlay.classList.add('active');
        }
      });
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }

  // Establecer sección inicial
  navigateTo('intro');
});
