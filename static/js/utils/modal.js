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
export function openConditionModal({ title, type, groupId, initialValues = null, columnName }) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    lastFocusedElement = document.activeElement;

    modalTitle.textContent = title;
    modalBody.innerHTML = generateFormHTML(type, groupId, initialValues, columnName);
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
      if (validateFormData(type, groupId, formData)) {
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
function generateFormHTML(type, groupId, values, columnName) {
  const v = values || {};

  // Вспомогательные функции для полей ввода
  const numberInput = (name, value, step = 'any', required = true) => `
    <input type="number" id="${name}" name="${name}" value="${value ?? ''}" step="${step}" ${required ? 'required' : ''} />
  `;

  const dateInput = (name, value) => `
    <input type="date" id="${name}" name="${name}" value="${value ?? ''}" />
  `;

  const textInput = (name, value, placeholder = '') => `
    <input type="text" id="${name}" name="${name}" value="${value ?? ''}" placeholder="${placeholder}" />
  `;

  const textareaInput = (name, value, placeholder, rows = 3) => `
    <textarea id="${name}" name="${name}" rows="${rows}" placeholder="${placeholder}">${value ?? ''}</textarea>
  `;

  switch (type) {
    case 'range':
      return `
        <form class="modal-form" onsubmit="return false">
          <div class="form-row">
            <div>
              <label for="minValue">От</label>
              ${numberInput('min', v.min)}
            </div>
            <div>
              <label for="maxValue">До</label>
              ${numberInput('max', v.max)}
            </div>
          </div>
        </form>
      `;

    case 'greater':
    case 'less':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="threshold">${type === 'greater' ? 'Больше чем' : 'Меньше чем'}</label>
            ${groupId === 1 ? numberInput('value', v.value) : dateInput('value', v.value)}
          </div>
        </form>
      `;

    case 'equal':
      if (groupId === 1) {
        return `
          <form class="modal-form" onsubmit="return false">
            <div>
              <label for="value">Значение</label>
              ${numberInput('value', v.value)}
            </div>
          </form>
        `;
      } else if (groupId === 3) {
        return `
          <form class="modal-form" onsubmit="return false">
            <div>
              <label for="value">Дата</label>
              ${dateInput('value', v.value)}
            </div>
          </form>
        `;
      } else { // текст
        return `
          <form class="modal-form" onsubmit="return false">
            <div>
              <label for="value">Точное значение</label>
              ${textInput('value', v.value)}
            </div>
          </form>
        `;
      }

    case 'in':
      const placeholder = groupId === 1 ? 'Введите числа через запятую или каждое с новой строки' :
                         groupId === 3 ? 'Введите даты в формате ГГГГ-ММ-ДД через запятую или каждую с новой строки' :
                         'Введите значения через запятую или каждое с новой строки';
      const valuesStr = Array.isArray(v.values) ? v.values.join('\n') : (v.values || '');
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="values">Список значений</label>
            ${textareaInput('values', valuesStr, placeholder)}
            <small class="form-hint">Каждое значение с новой строки или через запятую</small>
          </div>
        </form>
      `;

    case 'length_greater':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="minLength">Минимальная длина</label>
            ${numberInput('min', v.min, '1', true)}
          </div>
        </form>
      `;

    case 'length_less':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="maxLength">Максимальная длина</label>
            ${numberInput('max', v.max, '1', true)}
          </div>
        </form>
      `;

    case 'length_range':
      return `
        <form class="modal-form" onsubmit="return false">
          <div class="form-row">
            <div>
              <label for="minLength">Мин. длина</label>
              ${numberInput('min', v.min, '1', true)}
            </div>
            <div>
              <label for="maxLength">Макс. длина</label>
              ${numberInput('max', v.max, '1', true)}
            </div>
          </div>
        </form>
      `;

    case 'like':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="pattern">Шаблон LIKE</label>
            ${textInput('pattern', v.pattern, '%пример%')}
            <small class="form-hint">Используйте % для любого количества символов, _ для одного</small>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="ignoreCase" name="ignoreCase" ${v.ignoreCase ? 'checked' : ''} />
            <label for="ignoreCase">Игнорировать регистр</label>
          </div>
        </form>
      `;

    case 'regex':
      return `
        <form class="modal-form" onsubmit="return false">
          <div>
            <label for="pattern">Регулярное выражение</label>
            ${textInput('pattern', v.pattern, '^[A-Z].*')}
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
              ${dateInput('from', v.from)}
            </div>
            <div>
              <label for="dateTo">По дату</label>
              ${dateInput('to', v.to)}
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
    case 'less':
    case 'equal': {
      const value = document.getElementById('value')?.value;
      return {
        type,
        value: type === 'equal' && document.getElementById('value')?.type === 'number' ? parseFloat(value) : value,
      };
    }
    case 'in': {
      const raw = document.getElementById('values').value;
      // Разбиваем по запятым и переносам строк
      const items = raw.split(/[,\n]+/).map(s => s.trim()).filter(s => s !== '');
      return {
        type: 'in',
        values: items,
      };
    }
    case 'length_greater':
      return {
        type: 'length_greater',
        min: parseInt(document.getElementById('min').value, 10),
      };
    case 'length_less':
      return {
        type: 'length_less',
        max: parseInt(document.getElementById('max').value, 10),
      };
    case 'length_range':
      return {
        type: 'length_range',
        min: parseInt(document.getElementById('min').value, 10),
        max: parseInt(document.getElementById('max').value, 10),
      };
    case 'like':
      return {
        type: 'like',
        pattern: document.getElementById('pattern').value,
        ignoreCase: document.getElementById('ignoreCase').checked,
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
        from: document.getElementById('from').value || null,
        to: document.getElementById('to').value || null,
      };
    default:
      return null;
  }
}

function validateFormData(type, groupId, data) {
  if (!data) return false;

  switch (type) {
    case 'range':
    case 'length_range':
      if (data.min > data.max) {
        alert('Минимальное значение не может превышать максимальное');
        return false;
      }
      break;
    case 'in':
      if (!data.values || data.values.length === 0) {
        alert('Введите хотя бы одно значение');
        return false;
      }
      if (groupId === 1) {
        for (const val of data.values) {
          if (isNaN(parseFloat(val))) {
            alert(`"${val}" не является числом`);
            return false;
          }
        }
      } else if (groupId === 3) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        for (const val of data.values) {
          if (!dateRegex.test(val)) {
            alert(`"${val}" не соответствует формату ГГГГ-ММ-ДД`);
            return false;
          }
        }
      }
      break;
    case 'like':
      if (!data.pattern) {
        alert('Введите шаблон LIKE');
        return false;
      }
      break;
    case 'regex':
      if (!data.pattern) {
        alert('Введите регулярное выражение');
        return false;
      }
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
// Обновлённая функция форматирования
export function formatCondition(condition) {
  switch (condition.type) {
    case 'range':
      return `Значение от ${condition.min} до ${condition.max}`;
    case 'greater':
      return `> ${condition.value}`;
    case 'less':
      return `< ${condition.value}`;
    case 'equal':
      return `= ${condition.value}`;
    case 'in':
      const preview = condition.values.slice(0, 3).join(', ');
      const suffix = condition.values.length > 3 ? ` … +${condition.values.length - 3}` : '';
      return `IN (${preview}${suffix})`;
    case 'length_greater':
      return `Длина > ${condition.min}`;
    case 'length_less':
      return `Длина < ${condition.max}`;
    case 'length_range':
      return `Длина от ${condition.min} до ${condition.max}`;
    case 'like':
      return `LIKE '${condition.pattern}'${condition.ignoreCase ? ' (i)' : ''}`;
    case 'regex':
      return `Regex: /${condition.pattern}/${condition.ignoreCase ? 'i' : ''}`;
    case 'date_range':
      return `Дата: ${condition.from || '∞'} — ${condition.to || '∞'}`;
    default:
      return JSON.stringify(condition);
  }
}