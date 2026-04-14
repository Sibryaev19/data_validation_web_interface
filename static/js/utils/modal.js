/**
 * Modal window utilities
 */

const modal = document.getElementById('conditionModal');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
let modalResolve = null;
let lastFocusedElement = null;

/**
 * Open modal with condition form
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.type - Condition type
 * @param {Object|null} options.initialValues - Pre-filled values for edit mode
 * @param {string} options.columnName - Name of the column being configured
 * @returns {Promise<Object|null>} User input or null if cancelled
 */
export function openConditionModal({ title, type, initialValues = null, columnName }) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    lastFocusedElement = document.activeElement;

    modalTitle.textContent = title;
    modalBody.innerHTML = generateFormHTML(type, initialValues, columnName);
    modal.classList.add('is-open');
    modal.removeAttribute('hidden');

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 100);

    // Trap focus within modal
    modal.addEventListener('keydown', handleKeyDown);

    // Close handlers
    const closeHandlers = () => {
      closeModal(null);
    };

    modal.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', closeHandlers, { once: true });
    });

    modalSaveBtn.onclick = () => {
      const formData = collectFormData(type);
      if (validateFormData(type, formData)) {
        closeModal(formData);
      }
    };

    modalCancelBtn.onclick = () => closeModal(null);
  });
}

/**
 * Close modal and resolve promise
 * @param {Object|null} result - Form data or null
 */
function closeModal(result) {
  modal.classList.remove('is-open');
  modal.setAttribute('hidden', ''); // Возвращаем атрибут для семантики
  modal.removeEventListener('keydown', handleKeyDown);

  // Clear handlers
  modalSaveBtn.onclick = null;
  modalCancelBtn.onclick = null;
  modal.querySelectorAll('[data-close-modal]').forEach(el => {
    el.replaceWith(el.cloneNode(true));
  });

  if (modalResolve) {
    modalResolve(result);
    modalResolve = null;
  }

  // Restore focus
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

/**
 * Handle keyboard navigation in modal
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(null);
    return;
  }

  if (e.key === 'Tab') {
    // Focus trap
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Generate HTML form based on condition type
 */
function generateFormHTML(type, values, columnName) {
  const v = values || {};

  switch (type) {
    case 'range':
      return `
        <form class="modal-form" onsubmit="return false">
          <div class="form-row">
            <div>
              <label for="minValue">От</label>
              <input type="number" id="minValue" name="min" value="${v.min ?? ''}" step="any" required />
            </div>
            <div>
              <label for="maxValue">До</label>
              <input type="number" id="maxValue" name="max" value="${v.max ?? ''}" step="any" required />
            </div>
          </div>
        </form>
      `;

    case 'greater':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="threshold">Значение больше чем</label>
            <input type="number" id="threshold" name="value" value="${v.value ?? ''}" step="any" required />
          </div>
        </form>
      `;

    case 'less':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="threshold">Значение меньше чем</label>
            <input type="number" id="threshold" name="value" value="${v.value ?? ''}" step="any" required />
          </div>
        </form>
      `;

    case 'length_range':
      return `
        <form class="modal-form" onsubmit="return false">
          <div class="form-row">
            <div>
              <label for="minLength">Мин. длина</label>
              <input type="number" id="minLength" name="min" value="${v.min ?? ''}" min="0" required />
            </div>
            <div>
              <label for="maxLength">Макс. длина</label>
              <input type="number" id="maxLength" name="max" value="${v.max ?? ''}" min="0" required />
            </div>
          </div>
        </form>
      `;

    case 'regex':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="pattern">Регулярное выражение</label>
            <input type="text" id="pattern" name="pattern" value="${v.pattern ?? ''}" placeholder="^[A-Z].*" required />
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="ignoreCase" name="ignoreCase" ${v.ignoreCase ? 'checked' : ''} />
            <label for="ignoreCase">Игнорировать регистр</label>
          </div>
        </form>
      `;

    case 'date_range':
      return `
        <form class="modal-form" onsubmit="return false">
          <div class="form-row">
            <div>
              <label for="dateFrom">С даты</label>
              <input type="date" id="dateFrom" name="from" value="${v.from ?? ''}" />
            </div>
            <div>
              <label for="dateTo">По дату</label>
              <input type="date" id="dateTo" name="to" value="${v.to ?? ''}" />
            </div>
          </div>
        </form>
      `;

    default:
      return '<p>Неизвестный тип условия</p>';
  }
}

/**
 * Collect form data based on condition type
 */
function collectFormData(type) {
  switch (type) {
    case 'range':
      return {
        type: 'range',
        min: parseFloat(document.getElementById('minValue').value),
        max: parseFloat(document.getElementById('maxValue').value),
      };
    case 'greater':
      return {
        type: 'greater',
        value: parseFloat(document.getElementById('threshold').value),
      };
    case 'less':
      return {
        type: 'less',
        value: parseFloat(document.getElementById('threshold').value),
      };
    case 'length_range':
      return {
        type: 'length_range',
        min: parseInt(document.getElementById('minLength').value),
        max: parseInt(document.getElementById('maxLength').value),
      };
    case 'regex':
      return {
        type: 'regex',
        pattern: document.getElementById('pattern').value,
        ignoreCase: document.getElementById('ignoreCase').checked,
      };
    case 'date_range':
      return {
        type: 'date_range',
        from: document.getElementById('dateFrom').value || null,
        to: document.getElementById('dateTo').value || null,
      };
    default:
      return null;
  }
}

/**
 * Validate form data
 */
function validateFormData(type, data) {
  if (!data) return false;

  switch (type) {
    case 'range':
    case 'length_range':
      if (data.min > data.max) {
        alert('Минимальное значение не может превышать максимальное');
        return false;
      }
      break;
    case 'regex':
      try {
        new RegExp(data.pattern, data.ignoreCase ? 'i' : '');
      } catch (e) {
        alert('Некорректное регулярное выражение');
        return false;
      }
      break;
  }
  return true;
}

export function closeConditionModal() {
    if (modal.classList.contains('is-open') || !modal.hidden) {
        closeModal(null);
    }
}

/**
 * Format condition for display
 */
export function formatCondition(condition) {
  switch (condition.type) {
    case 'range':
      return `Значение от ${condition.min} до ${condition.max}`;
    case 'greater':
      return `> ${condition.value}`;
    case 'less':
      return `< ${condition.value}`;
    case 'length_range':
      return `Длина от ${condition.min} до ${condition.max}`;
    case 'regex':
      return `Regex: /${condition.pattern}/${condition.ignoreCase ? 'i' : ''}`;
    case 'date_range':
      return `Дата: ${condition.from || '∞'} — ${condition.to || '∞'}`;
    default:
      return JSON.stringify(condition);
  }
}