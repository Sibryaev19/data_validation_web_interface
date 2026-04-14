/**
 * Module 2: Column Configuration
 * Handles column table display, condition management, and validation trigger
 */

import { apiPost } from '../utils/api.js';
import { openConditionModal, formatCondition } from '../utils/modal.js';

const CONDITION_OPTIONS = {
  numeric: [
    { value: '', label: 'Нет' },
    { value: 'range', label: 'Значение в промежутке' },
    { value: 'greater', label: 'Больше чем' },
    { value: 'less', label: 'Меньше чем' },
  ],
  string: [
    { value: '', label: 'Нет' },
    { value: 'length_range', label: 'Длина в диапазоне' },
    { value: 'regex', label: 'Соответствует регулярному выражению' },
  ],
  date: [
    { value: '', label: 'Нет' },
    { value: 'date_range', label: 'В диапазоне дат' },
  ],
};

const COLUMN_TYPES = {
  numeric: ['integer', 'bigint', 'smallint', 'decimal', 'numeric', 'float', 'double', 'real'],
  string: ['varchar', 'char', 'text', 'string'],
  date: ['date', 'timestamp', 'datetime', 'time'],
};

export class TableConfigModule {
  constructor(tableName, columns, onValidate, onValidateStart) {
    this.tableName = tableName;
    this.columns = columns;
    this.onValidate = onValidate;
    this.onValidateStart = onValidateStart;
    this.conditions = {}; // { columnName: [condition1, condition2, ...] }

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
    // Toggle config section
    this.toggleBtn.addEventListener('click', () => this.toggleConfig());

    // Validate button
    this.validateBtn.addEventListener('click', () => this.handleValidate());

    // Render table
    this.renderTable();
  }

  toggleConfig() {
    const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
    this.toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    this.configContent.hidden = isExpanded;
  }

  renderTable() {
    // Use DocumentFragment for performance with many rows
    const fragment = document.createDocumentFragment();

    this.columns.forEach((column, index) => {
      const row = document.createElement('tr');
      row.innerHTML = this.renderRow(column, index);
      fragment.appendChild(row);
    });

    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(fragment);

    // Attach event listeners
    this.attachRowListeners();
  }

  renderRow(column, index) {
    const conditions = this.conditions[column.name] || [];
    const description = column.description || 'описание отсутствует';
    const truncatedDesc = description.length > 50
      ? description.slice(0, 50) + '…'
      : description;

    const columnType = this.getColumnType(column.type);
    const options = CONDITION_OPTIONS[columnType] || CONDITION_OPTIONS.string;

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
    // Condition select change
    this.tableBody.querySelectorAll('.condition-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const type = e.target.value;
        const columnName = e.target.dataset.column;

        if (!type) return;

        const column = this.columns.find(c => c.name === columnName);
        const columnType = this.getColumnType(column.type);
        const optionLabel = e.target.options[e.target.selectedIndex].text;

        try {
          const result = await openConditionModal({
            title: `${optionLabel} — ${columnName}`,
            type,
            columnName,
          });

          if (result) {
            this.addCondition(columnName, result);
            this.renderTable();
          }
          // Reset select to "Нет"
          e.target.value = '';
        } catch (err) {
          console.error('Modal error:', err);
          e.target.value = '';
        }
      });
    });

    // Edit/Delete buttons
    this.tableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const columnName = e.currentTarget.dataset.column;
        const idx = parseInt(e.currentTarget.dataset.idx);
        const column = this.columns.find(c => c.name === columnName);
        const condition = this.conditions[columnName]?.[idx];

        if (!condition) return;

        const columnType = this.getColumnType(column.type);
        const conditionDef = Object.values(CONDITION_OPTIONS)
          .flat()
          .find(opt => opt.value === condition.type);

        try {
          const result = await openConditionModal({
            title: `Редактировать — ${columnName}`,
            type: condition.type,
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

  getColumnType(dbType) {
    const type = dbType.toLowerCase();
    if (COLUMN_TYPES.numeric.includes(type)) return 'numeric';
    if (COLUMN_TYPES.string.includes(type)) return 'string';
    if (COLUMN_TYPES.date.includes(type)) return 'date';
    return 'string'; // default
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async handleValidate() {
    const rowLimit = parseInt(this.rowLimitInput.value) || 10000000;

    this.setLoading(true);
    this.hideError();

    // Вызываем колбэк для показа скелетонов
    if (this.onValidateStart) {
      this.onValidateStart();
    }

    const payload = {
      tableName: this.tableName,
      rowLimit,
      columnConditions: this.conditions,
    };

    try {
      const data = await apiPost('/api/validate', payload);
      this.onValidate(data);
    } catch (error) {
      console.error('Validation error:', error);
      const message = error?.message || 'Ошибка при запуске валидации';
      this.showError(message);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.validateBtn.disabled = loading;
    this.rowLimitInput.disabled = loading;
    this.spinner.hidden = !loading;

    // Disable condition selects during validation
    this.tableBody.querySelectorAll('.condition-select, .btn-edit, .btn-delete')
      .forEach(el => el.disabled = loading);
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  hideError() {
    this.errorEl.hidden = true;
  }

  collapse() {
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.configContent.hidden = true;
  }

  show() {
    this.module.hidden = false;
    this.module.classList.add('active');
  }

  hide() {
    this.module.hidden = true;
    this.module.classList.remove('active');
  }

  reset() {
    // Очищаем только данные и состояние, без перерисовки таблицы
    this.conditions = {};
    this.rowLimitInput.value = '10000000';
    this.hideError();
    this.validateBtn.disabled = false;
    this.rowLimitInput.disabled = false;
    this.spinner.hidden = true;

    // Сбрасываем состояние сворачивания (для следующего использования)
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.configContent.hidden = false;

    // Очищаем визуальные эффекты
    this.module.style.opacity = '';
    this.module.style.pointerEvents = '';
}
}