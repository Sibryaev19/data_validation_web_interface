/**
 * Module 2: Column Configuration (упрощённая версия)
 * Поддерживает переиспользование экземпляра при смене таблицы.
 */

import { apiPost } from '../utils/api.js';
import { openConditionModal, formatCondition } from '../utils/modal.js';

const CONDITION_OPTIONS = {
  1: [ // Числа
    { value: '', label: 'Нет' },
    { value: 'greater', label: 'Больше чем' },
    { value: 'less', label: 'Меньше чем' },
    { value: 'range', label: 'Значение в промежутке' },
    { value: 'equal', label: 'Равно значению' },
    { value: 'in', label: 'В списке значений' },
  ],
  2: [ // Текст
    { value: '', label: 'Нет' },
    { value: 'length_greater', label: 'Длина больше' },
    { value: 'length_less', label: 'Длина меньше' },
    { value: 'length_range', label: 'Длина в диапазоне' },
    { value: 'like', label: 'LIKE (по шаблону)' },
    { value: 'regex', label: 'Регулярное выражение' },
    { value: 'equal', label: 'Точное совпадение' },
    { value: 'in', label: 'В списке значений' },
  ],
  3: [ // Даты
    { value: '', label: 'Нет' },
    { value: 'greater', label: 'Позже чем' },
    { value: 'less', label: 'Раньше чем' },
    { value: 'range', label: 'В диапазоне дат' },
    { value: 'equal', label: 'Равно дате' },
    { value: 'in', label: 'В списке дат' },
  ],
  4: [ // Остальные типы
    { value: '', label: 'Нет' },
  ],
};

const COLUMN_TYPES = {
  numeric: ['integer', 'bigint', 'smallint', 'decimal', 'numeric', 'float', 'double', 'real'],
  string: ['varchar', 'char', 'text', 'string'],
  date: ['date', 'timestamp', 'datetime', 'time'],
};

export class TableConfigModule {
  constructor(onValidateStart) {
    // Колбэк для показа скелетонов перед стартом валидации
    this.onValidateStart = onValidateStart;
    // Колбэк для запуска валидации (будет установлен из App)
    this.validateCallback = null;

    this.tableName = '';
    this.columns = [];
    this.conditions = {};

    // DOM элементы
    this.module = document.getElementById('configModule');
    this.toggleBtn = document.getElementById('toggleConfigBtn');
    this.configContent = document.getElementById('configContent');
    this.tableBody = document.getElementById('columnsTableBody');
    this.rowLimitInput = document.getElementById('rowLimitInput');
    this.validateBtn = document.getElementById('validateBtn');
    this.spinner = document.getElementById('validateSpinner');
    this.errorEl = document.getElementById('validateError');

    this.init();
  }

  init() {
    // Переключение сворачивания секции
    this.toggleBtn.addEventListener('click', () => this.toggleConfig());

    // Кнопка валидации
    this.validateBtn.addEventListener('click', () => this.handleValidate());
  }

  /**
   * Установить внешний колбэк для выполнения валидации
   */
  setValidateCallback(cb) {
    this.validateCallback = cb;
  }

  /**
   * Загрузить новую таблицу (переиспользование экземпляра)
   */
  setTable(tableName, columns) {
    this.tableName = tableName;
    this.columns = columns;
    this.conditions = {};
    this.rowLimitInput.value = '10000000';
    this.hideError();
    this.renderTable();
    // Разворачиваем секцию настроек (можно сделать настройкой)
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.configContent.hidden = false;
  }

  /**
   * Получить текущий лимит строк
   */
  getRowLimit() {
    return parseInt(this.rowLimitInput.value) || 10000000;
  }

  /**
   * Получить объект условий
   */
  getConditions() {
    return this.conditions;
  }

  /**
   * Обработчик нажатия на кнопку "Начать валидацию"
   */
  async handleValidate() {
    this.setLoading(true);
    this.hideError();

    // Показываем скелетоны в модуле результатов
    if (this.onValidateStart) {
      this.onValidateStart();
    }

    if (this.validateCallback) {
      this.validateCallback(); // App сам выполнит запрос и управление
    } else {
      console.error('Validate callback not set in TableConfigModule');
      this.setLoading(false);
    }
  }

  /**
   * Сбросить состояние (условия, ошибки) без скрытия модуля
   */
  resetState() {
    this.conditions = {};
    this.rowLimitInput.value = '10000000';
    this.hideError();
    // Таблица будет перерисована при следующем setTable
  }

  /**
   * Полный сброс и скрытие модуля
   */
  reset() {
    this.resetState();
    this.hide();
  }

  // ------------------- UI методы ---------------------
  show() {
    this.module.hidden = false;
    this.module.classList.add('active');
  }

  hide() {
    this.module.hidden = true;
    this.module.classList.remove('active');
  }

  collapse() {
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.configContent.hidden = true;
  }

  toggleConfig() {
    const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
    this.toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    this.configContent.hidden = isExpanded;
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  hideError() {
    this.errorEl.hidden = true;
  }

  setLoading(loading) {
    this.validateBtn.disabled = loading;
    this.rowLimitInput.disabled = loading;
    this.spinner.hidden = !loading;

    const interactiveSelectors = '.condition-select, .btn-edit, .btn-delete';
    this.tableBody.querySelectorAll(interactiveSelectors).forEach(el => {
      if (el instanceof HTMLButtonElement || el instanceof HTMLSelectElement) {
        el.disabled = loading;
      }
    });
  }

  // ------------------- Рендеринг таблицы ---------------------
  renderTable() {
    const fragment = document.createDocumentFragment();

    this.columns.forEach((column, index) => {
      const row = document.createElement('tr');
      row.innerHTML = this.renderRow(column, index);
      fragment.appendChild(row);
    });

    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(fragment);
    this.attachRowListeners();
  }

  renderRow(column, index) {
    const conditions = this.conditions[column.name] || [];
    const description = column.description || 'описание отсутствует';
    const truncatedDesc = description.length > 50
      ? description.slice(0, 50) + '…'
      : description;

    const groupId = this.getTypeGroupId(column);
    const options = CONDITION_OPTIONS[groupId] || CONDITION_OPTIONS[4];

    return `
      <td><strong>${this.escapeHtml(column.name)}</strong></td>
      <td><code>${this.escapeHtml(column.type)}</code></td>
      <td>
        ${description.length > 50
          ? `<span class="tooltip">
              <span class="truncated-text" tabindex="0">${this.escapeHtml(truncatedDesc)}</span>
              <span class="tooltip-text">${this.escapeHtml(description)}</span>
            </span>`
          : `<span>${this.escapeHtml(description)}</span>`
        }
      </td>
      <td>
        <select class="input-field condition-select" data-column="${this.escapeHtml(column.name)}" data-index="${index}">
          ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="condition-list" data-column="${this.escapeHtml(column.name)}">
          ${conditions.map((cond, i) => `
            <span class="condition-tag">
              ${this.escapeHtml(formatCondition(cond))}
              <span class="condition-actions">
                <button class="btn-icon btn-edit" data-column="${this.escapeHtml(column.name)}" data-idx="${i}" aria-label="Редактировать">✏️</button>
                <button class="btn-icon btn-delete" data-column="${this.escapeHtml(column.name)}" data-idx="${i}" aria-label="Удалить">🗑️</button>
              </span>
            </span>
          `).join('')}
        </div>
      </td>
    `;
  }

  attachRowListeners() {
    // Обработчик выбора нового условия
    this.tableBody.querySelectorAll('.condition-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const type = e.target.value;
        const columnName = e.target.dataset.column;

        if (!type) return;

        const column = this.columns.find(c => c.name === columnName);
        if (!column) {
          console.warn(`Column ${columnName} not found`);
          e.target.value = '';
          return;
        }

        const optionLabel = e.target.options[e.target.selectedIndex].text;

        try {
          const groupId = this.getTypeGroupId(column);
          const result = await openConditionModal({
            title: `${optionLabel} — ${columnName}`,
            type,
            groupId,
            columnName,
            initialValues: null
          });

          if (result) {
            this.addCondition(columnName, result);
            this.renderTable();
          }
        } catch (err) {
          console.error('Modal error:', err);
        } finally {
          e.target.value = ''; // сброс на "Нет"
        }
      });
    });

    // Редактирование условия
    this.tableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const columnName = e.currentTarget.dataset.column;
        const idx = parseInt(e.currentTarget.dataset.idx);
        const condition = this.conditions[columnName]?.[idx];

        if (!condition) {
          console.warn(`Condition not found for ${columnName}[${idx}]`);
          return;
        }

        const column = this.columns.find(c => c.name === columnName);
        if (!column) {
          console.warn(`Column ${columnName} not found during edit`);
          return;
        }

        try {
          const groupId = this.getTypeGroupId(column);
          const result = await openConditionModal({
            title: `Редактировать — ${columnName}`,
            type: condition.type,
            groupId,
            initialValues: condition,
            columnName,
          });

          if (result) {
            this.conditions[columnName][idx] = result;
            this.renderTable();
          }
        } catch (err) {
          console.error('Edit error:', err);
        }
      });
    });

    // Удаление условия
    this.tableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const columnName = e.currentTarget.dataset.column;
        const idx = parseInt(e.currentTarget.dataset.idx);

        if (this.conditions[columnName]) {
          this.conditions[columnName].splice(idx, 1);
          if (this.conditions[columnName].length === 0) {
            delete this.conditions[columnName];
          }
          this.renderTable();
        } else {
          console.warn(`No conditions for ${columnName} on delete`);
        }
      });
    });
  }

  addCondition(columnName, condition) {
    if (!this.conditions[columnName]) {
      this.conditions[columnName] = [];
    }
    this.conditions[columnName].push(condition);
  }

  getTypeGroupId(column) {
    // Если есть type_group_id, используем его
    if (column.type_group_id !== undefined) {
      return column.type_group_id;
    }
    // Fallback по имени типа (старая логика)
    const type = column.type.toLowerCase();
    if (COLUMN_TYPES.numeric.includes(type)) return 1;
    if (COLUMN_TYPES.string.includes(type)) return 2;
    if (COLUMN_TYPES.date.includes(type)) return 3;
    return 4;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}