/**
 * Gamified Assessment Engine for SENA OVAs
 * Servicio Nacional de Aprendizaje - SENA
 */

class SenaQuizEngine {
  constructor(config) {
    this.containerId = config.containerId || 'quizContainer';
    this.questions = config.questions || [];
    this.passingScore = config.passingScore || 70;
    this.ovaCode = config.ovaCode || 'OVA-SENA';
    this.ovaTitle = config.ovaTitle || 'Evaluación Formativa';
    this.userAnswers = {};
    this.isSubmitted = false;
    this.init();
  }

  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    let html = `
      <div class="sena-card" style="border-top: 4px solid var(--sena-green);">
        <div class="sena-card-header">
          <div class="card-title-group">
            <div class="card-icon">📝</div>
            <div>
              <h3 class="card-title">Cuestionario de Evaluación y Certificación</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                Responde las preguntas. Para aprobar y obtener tu constancia requieres un mínimo de <strong>${this.passingScore}%</strong>.
              </p>
            </div>
          </div>
          <div id="quizScoreBadge" style="display: none; font-size: 0.9rem; font-weight: 700; padding: 6px 14px; border-radius: var(--radius-full);"></div>
        </div>

        <form id="quizForm" style="display: flex; flex-direction: column; gap: 24px;">
    `;

    this.questions.forEach((q, idx) => {
      html += `
        <div class="quiz-question-box" id="qBox_${idx}" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; transition: var(--transition);">
          <div style="display: flex; gap: 12px; margin-bottom: 14px;">
            <span style="background: var(--sena-blue); color: #FFF; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0;">${idx + 1}</span>
            <h4 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); line-height: 1.4;">${q.pregunta}</h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-left: 40px;">
      `;

      q.opciones.forEach((opc, opcIdx) => {
        html += `
          <label class="quiz-option-label" id="opt_${idx}_${opcIdx}" style="display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; cursor: pointer; transition: var(--transition);">
            <input type="radio" name="question_${idx}" value="${opcIdx}" style="accent-color: var(--sena-green); width: 18px; height: 18px;" />
            <span style="font-size: 0.92rem; color: var(--text-primary);">${opc}</span>
          </label>
        `;
      });

      html += `
          </div>
          <div class="quiz-feedback-box" id="feedback_${idx}" style="display: none; margin-top: 14px; margin-left: 40px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.88rem; line-height: 1.5;"></div>
        </div>
      `;
    });

    html += `
          <div style="display: flex; justify-content: center; gap: 16px; margin-top: 12px;">
            <button type="button" id="btnSubmitQuiz" class="btn btn-primary" style="padding: 12px 32px;">
              🚀 Enviar Respuestas y Calificar
            </button>
            <button type="button" id="btnRetryQuiz" class="btn btn-secondary" style="display: none;">
              🔄 Reintentar Evaluación
            </button>
          </div>
        </form>

        <!-- Contenedor del Certificado de Aprobación -->
        <div id="certificateContainer" style="display: none;"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const btnSubmit = document.getElementById('btnSubmitQuiz');
    const btnRetry = document.getElementById('btnRetryQuiz');

    btnSubmit.addEventListener('click', () => this.evaluate());
    btnRetry.addEventListener('click', () => this.reset());

    // Highlight seleccionado
    this.questions.forEach((_, qIdx) => {
      const radios = document.getElementsByName(`question_${qIdx}`);
      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          if (this.isSubmitted) return;
          this.questions[qIdx].opciones.forEach((__, oIdx) => {
            const label = document.getElementById(`opt_${qIdx}_${oIdx}`);
            if (label) label.style.borderColor = 'var(--border-color)';
          });
          const selectedLabel = document.getElementById(`opt_${qIdx}_${radio.value}`);
          if (selectedLabel) selectedLabel.style.borderColor = 'var(--sena-green)';
        });
      });
    });
  }

  evaluate() {
    let answeredCount = 0;
    this.questions.forEach((_, idx) => {
      const selected = document.querySelector(`input[name="question_${idx}"]:checked`);
      if (selected) answeredCount++;
    });

    if (answeredCount < this.questions.length) {
      alert(`Por favor responde todas las preguntas antes de calificar. Has respondido ${answeredCount} de ${this.questions.length}.`);
      return;
    }

    this.isSubmitted = true;
    let correctCount = 0;

    this.questions.forEach((q, idx) => {
      const selected = document.querySelector(`input[name="question_${idx}"]:checked`);
      const userVal = parseInt(selected.value, 10);
      const isCorrect = userVal === q.correcta;
      if (isCorrect) correctCount++;

      const feedbackBox = document.getElementById(`feedback_${idx}`);
      const qBox = document.getElementById(`qBox_${idx}`);

      feedbackBox.style.display = 'block';
      if (isCorrect) {
        feedbackBox.style.background = 'var(--sena-green-subtle)';
        feedbackBox.style.color = 'var(--sena-green-dark)';
        feedbackBox.style.borderLeft = '4px solid var(--sena-green)';
        feedbackBox.innerHTML = `<strong>✓ ¡Correcto!</strong> ${q.feedback}`;
        qBox.style.borderColor = 'var(--sena-green)';
      } else {
        feedbackBox.style.background = '#fff1f0';
        feedbackBox.style.color = '#cf1322';
        feedbackBox.style.borderLeft = '4px solid #f5222d';
        feedbackBox.innerHTML = `<strong>✗ Incorrecto.</strong> Respuesta correcta: <em>${q.opciones[q.correcta]}</em>.<br><span style="margin-top: 4px; display: inline-block;">${q.feedback}</span>`;
        qBox.style.borderColor = '#ffccc7';
      }

      // Marcar visualmente la correcta
      const correctLabel = document.getElementById(`opt_${idx}_${q.correcta}`);
      if (correctLabel) {
        correctLabel.style.background = 'var(--sena-green-subtle)';
        correctLabel.style.borderColor = 'var(--sena-green)';
        correctLabel.style.fontWeight = '600';
      }
    });

    const scorePercentage = Math.round((correctCount / this.questions.length) * 100);
    const passed = scorePercentage >= this.passingScore;

    // Reportar a SCORM
    if (typeof ScormConnector !== 'undefined') {
      ScormConnector.setScore(scorePercentage, passed);
    }

    // Badge de resultado
    const badge = document.getElementById('quizScoreBadge');
    badge.style.display = 'inline-block';
    badge.style.background = passed ? 'var(--sena-green)' : '#f5222d';
    badge.style.color = '#FFFFFF';
    badge.innerText = `Puntaje: ${scorePercentage}% (${passed ? 'APROBADO' : 'NO APROBADO'})`;

    // Botones
    document.getElementById('btnSubmitQuiz').style.display = 'none';
    document.getElementById('btnRetryQuiz').style.display = 'inline-flex';

    // Deshabilitar inputs
    document.querySelectorAll('#quizForm input[type="radio"]').forEach(r => r.disabled = true);

    // Certificado si aprueba
    if (passed) {
      this.renderCertificate(scorePercentage);
    }
  }

  renderCertificate(score) {
    const cert = document.getElementById('certificateContainer');
    const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    
    cert.style.display = 'block';
    cert.innerHTML = `
      <div class="certificate-box">
        <div class="certificate-header">SERVICIO NACIONAL DE APRENDIZAJE – SENA | REGIONAL BOYACÁ</div>
        <h2 class="certificate-title">CONSTANCIA DE APROBACIÓN VIRTUAL</h2>
        <div style="font-size: 0.95rem; opacity: 0.9;">Se certifica que el aprendiz:</div>
        <div class="certificate-name" contenteditable="true" title="Haz clic para escribir tu nombre">APRENDIZ SENA</div>
        <div class="certificate-body">
          Ha completado y superado satisfactoriamente los criterios pedagógicos y técnicos del objeto virtual de aprendizaje:
          <br><strong style="color: var(--sena-yellow); font-size: 1.15rem; display: inline-block; margin-top: 6px;">${this.ovaTitle}</strong>
          <br>Calificación obtenida: <strong>${score} / 100</strong> | Fecha: <strong>${today}</strong>
        </div>
        <div class="certificate-seal">✓</div>
        <div style="margin-top: 14px; font-size: 0.75rem; opacity: 0.7; letter-spacing: 1px;">
          Instructor Responsable: Diego Alonso Ojeda Medina – Instructor Sistemas – Centro Minero<br>CENTRO MINERO – SOGAMOSO | PROYECTO SENNOVA MGA_2025_35_294
        </div>
        <button type="button" class="btn btn-secondary" onclick="window.print()" style="margin-top: 20px; font-size: 0.85rem;">
          🖨️ Imprimir / Guardar Constancia
        </button>
      </div>
    `;

    // Scroll suave al certificado
    cert.scrollIntoView({ behavior: 'smooth' });
  }

  reset() {
    this.isSubmitted = false;
    this.render();
    document.getElementById('quizContainer').scrollIntoView({ behavior: 'smooth' });
  }
}
