/**
 * SCORM 1.2 Wrapper API & Local Fallback
 * Servicio Nacional de Aprendizaje - SENA
 */

const ScormConnector = (function() {
  let api = null;
  let isInitialized = false;
  let isStandalone = false;
  let startTime = new Date();

  function findAPI(win) {
    let attempts = 0;
    while (win && !win.API && win.parent && win.parent !== win && attempts < 10) {
      attempts++;
      win = win.parent;
    }
    return win && win.API ? win.API : null;
  }

  function getAPI() {
    try {
      api = findAPI(window);
      if (!api && window.opener) {
        api = findAPI(window.opener);
      }
    } catch (e) {
      console.warn('Acceso a ventana padre restringido:', e);
    }
    return api;
  }

  function init() {
    const lmsApi = getAPI();
    if (lmsApi) {
      try {
        const res = lmsApi.LMSInitialize('');
        if (res === 'true' || res === true) {
          isInitialized = true;
          isStandalone = false;
          // Si el estado es not attempted, marcar incomplete
          const currentStatus = lmsApi.LMSGetValue('cmi.core.lesson_status');
          if (!currentStatus || currentStatus === 'not attempted') {
            lmsApi.LMSSetValue('cmi.core.lesson_status', 'incomplete');
            lmsApi.LMSCommit('');
          }
          console.log('[SCORM 1.2] Conectado exitosamente con LMS');
          return true;
        }
      } catch (err) {
        console.error('[SCORM 1.2] Error al inicializar:', err);
      }
    }

    // Modo Autónomo (Offline / Local)
    isStandalone = true;
    isInitialized = true;
    console.log('[SCORM 1.2] Modo local/autónomo activo (almacenamiento en localStorage)');
    return true;
  }

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  function setScore(score, passed = true) {
    if (!isInitialized) init();
    const cleanScore = Math.max(0, Math.min(100, Math.round(score)));
    const status = passed ? 'passed' : 'failed';

    if (api && !isStandalone) {
      try {
        api.LMSSetValue('cmi.core.score.raw', String(cleanScore));
        api.LMSSetValue('cmi.core.score.min', '0');
        api.LMSSetValue('cmi.core.score.max', '100');
        api.LMSSetValue('cmi.core.lesson_status', status);
        api.LMSCommit('');
        console.log(`[SCORM 1.2] Score enviado a LMS: ${cleanScore} (${status})`);
      } catch (e) {
        console.error('[SCORM 1.2] Error registrando puntaje:', e);
      }
    } else {
      localStorage.setItem('sena_scorm_score', String(cleanScore));
      localStorage.setItem('sena_scorm_status', status);
    }
  }

  function setLessonStatus(status) {
    if (!isInitialized) init();
    if (api && !isStandalone) {
      try {
        api.LMSSetValue('cmi.core.lesson_status', status);
        api.LMSCommit('');
      } catch (e) {
        console.error('[SCORM 1.2] Error enviando status:', e);
      }
    } else {
      localStorage.setItem('sena_scorm_status', status);
    }
  }

  function finish() {
    if (!isInitialized) return;
    const elapsedSeconds = Math.round((new Date() - startTime) / 1000);
    const formatted = formatTime(elapsedSeconds);

    if (api && !isStandalone) {
      try {
        api.LMSSetValue('cmi.core.session_time', formatted);
        api.LMSCommit('');
        api.LMSFinish('');
      } catch (e) {
        console.error('[SCORM 1.2] Error al finalizar sesión:', e);
      }
    }
    isInitialized = false;
  }

  // Listener para cerrar sesión SCORM ordenadamente
  window.addEventListener('beforeunload', finish);

  return {
    init,
    setScore,
    setLessonStatus,
    finish,
    isStandalone: () => isStandalone
  };
})();
