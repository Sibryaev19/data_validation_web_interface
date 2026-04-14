/**
 * Module 3: Statistics Visualization
 * Renders metadata and column statistics tables
 */

// Словарь описаний для специальных проверок (type_special)
const SPECIAL_DESCRIPTIONS = {
  problematic_symbols: 'Количество записей с проблемными символами (управляющие, непечатные)',
  leading_gaps: 'Количество записей с пробелами в начале строки',
  mixed_language: 'Количество записей, где смешаны кириллица и латиница',
  quantile_lower_bound: 'Нижняя граница квантиля',
  quantile_lower_count: 'Количество значений ниже нижней границы квантиля',
  quantile_upper_bound: 'Верхняя граница квантиля',
  quantile_upper_count: 'Количество значений выше верхней границы квантиля',
  default_1970_count: 'Количество дат, равных 1970-01-01 (значение по умолчанию)',
  less_min_date: 'Количество дат ранее минимально допустимой даты',
  more_cur_date: 'Количество дат в будущем (позже текущей)'
};

export class ValidationResultsModule {
  constructor() {
    this.module = document.getElementById('resultsModule');
    this.metadataContainer = document.getElementById('metadataTableContainer');
    this.generalStatsContainer = document.getElementById('generalStatsTableContainer');
    this.columnStatsContainer = document.getElementById('columnStatsTableContainer');
  }

  /**
   * Render statistics from API response
   * @param {Object} data - Response from /api/validate
   */
  render(data) {
    this.renderMetadata(data.table_metadata_statistics);
    this.renderSampleGeneralStats(data.sample_general_statistics);
    this.renderColumnStats(data.sample_statistics);
    this.show();
  }

  renderMetadata(rows) {
    if (!rows?.length) {
      this.metadataContainer.innerHTML = '<p>Нет данных</p>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'stats-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Параметр</th>
          <th scope="col">Описание</th>
          <th scope="col">Значение</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([key, desc, value]) => `
          <tr>
            <td><strong>${this.escapeHtml(key)}</strong></td>
            <td>${this.escapeHtml(desc || '—')}</td>
            <td>${this.formatValue(value || '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    this.metadataContainer.innerHTML = '';
    this.metadataContainer.appendChild(table);
  }
  renderSampleGeneralStats(rows) {
    if (!rows?.length) {
      this.generalStatsContainer.innerHTML = '<p>Нет данных</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'stats-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Параметр</th>
          <th scope="col">Описание</th>
          <th scope="col">Значение</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([key, desc, value]) => `
          <tr>
            <td><strong>${this.escapeHtml(key)}</strong></td>
            <td>${this.escapeHtml(desc || '—')}</td>
            <td>${this.formatValue(value || '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    this.generalStatsContainer.innerHTML = '';
    this.generalStatsContainer.appendChild(table);
  }

  renderColumnStats(stats) {
    if (!stats || Object.keys(stats).length === 0) {
      this.columnStatsContainer.innerHTML = '<p>Нет данных</p>';
      return;
    }

    const columns = Object.keys(stats);
    const allMetrics = [...new Set(
      columns.flatMap(col => Object.keys(stats[col]))
    )];

    // Жесткий порядок колонок – только те, что есть в данных
    const DESIRED_ORDER = [
      'type', 'null_count', 'unique_count', 'min', 'max', 'median', 'zero', 'type_special', 'custom'
    ];
    const orderedMetrics = DESIRED_ORDER.filter(m => allMetrics.includes(m));

    const table = document.createElement('table');
    table.className = 'stats-table';

    table.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Колонка</th>
          ${orderedMetrics.map(m => `<th scope="col">${this.formatMetricName(m)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${columns.map(col => `
          <tr>
            <td><strong>${this.escapeHtml(col)}</strong></td>
            ${orderedMetrics.map(m => {
              const val = stats[col][m];
              return `<td>${val !== undefined && val !== null ? this.formatValue(val) : '—'}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;

    this.columnStatsContainer.innerHTML = '';
    this.columnStatsContainer.appendChild(table);
  }

  formatMetricName(name) {
    const names = {
      type: 'Тип данных',
      null_count: 'Кол-во<br>NULL',
      unique_count: 'Кол-во<br>уникальных',
      min: 'Минимальное<br>значение / длина<br>(для String)',
      max: 'Максимальное<br>значение / длина<br>(для String)',
      median: 'Среднее<br>значение / длина<br>(для String)',
      zero: "Кол-во<br>0 или ''<br>(для String)",
      type_special: 'Спец. проверки<br>типов',
      custom: 'Пользовательские<br>проверки'
    };
    return names[name] || name;
  }

  formatValue(value) {
    if (value === null || value === undefined) return '—';

    // Числа
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? value.toLocaleString('ru-RU')
        : value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    }

    // Булевы
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';

    // custom: массив пар [[name, val, description?], ...]
    if (Array.isArray(value)) {
      return value.map(item => {
        const [name, val, desc] = item;
        const safeName = this.escapeHtml(String(name));
        const safeVal = typeof val === 'number'
          ? val.toLocaleString('ru-RU', { maximumFractionDigits: 4 })
          : this.escapeHtml(String(val ?? '—'));

        return `
          <div class="custom-check">
            <span class="tooltip">
              <span class="custom-name">${safeName}:</span>
              ${desc ? `<span class="tooltip-text">${this.escapeHtml(desc)}</span>` : ''}
            </span>
            <span class="custom-val">${safeVal}</span>
          </div>
        `;
      }).join('');
    }

    // type_special: объект { key: val, ... }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).map(([k, v]) => {
        const safeKey = this.escapeHtml(String(k));
        const safeVal = typeof v === 'number'
          ? v.toLocaleString('ru-RU', { maximumFractionDigits: 4 })
          : this.escapeHtml(String(v ?? '—'));
        const description = SPECIAL_DESCRIPTIONS[k] || '';
        // Используем тултип как в TableConfigModule
        return `
          <div class="special-check">
            <span class="tooltip">
              <span class="special-key">${safeKey}:</span>
              ${description ? `<span class="tooltip-text">${this.escapeHtml(description)}</span>` : ''}
            </span>
            <span class="special-val">${safeVal}</span>
          </div>
        `;
      }).join('');
    }

    // Строки и прочее
    return this.escapeHtml(String(value));
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  show() {
    this.module.hidden = false;
    this.module.classList.add('active');
  }

  hide() {
    this.module.hidden = true;
    this.module.classList.remove('active');
  }

  showSkeletons() {
    this.metadataContainer.innerHTML = this.getMetadataSkeletonHTML();
    this.generalStatsContainer.innerHTML = this.getMetadataSkeletonHTML();
    this.columnStatsContainer.innerHTML = this.getColumnStatsSkeletonHTML();
    this.show();
  }

  getMetadataSkeletonHTML() {
    return `
      <table class="stats-table skeleton-table">
        <thead><tr><th>Параметр</th><th>Описание</th><th>Значение</th></tr></thead>
        <tbody>
          ${Array(5).fill(0).map(() => `
            <tr class="skeleton-row">
              <td class="skeleton-cell"><div class="skeleton-line"></div></td>
              <td class="skeleton-cell"><div class="skeleton-line"></div></td>
              <td class="skeleton-cell"><div class="skeleton-line"></div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getColumnStatsSkeletonHTML() {
    const columnCount = 6;
    return `
      <table class="stats-table skeleton-table">
        <thead>
          <tr>
            <th>Колонка</th>
            ${Array(columnCount).fill(0).map(() => `<th>—</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${Array(4).fill(0).map(() => `
            <tr class="skeleton-row">
              <td class="skeleton-cell"><div class="skeleton-line"></div></td>
              ${Array(columnCount).fill(0).map(() => `<td class="skeleton-cell"><div class="skeleton-line"></div></td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  clear() {
    this.metadataContainer.innerHTML = '';
    this.generalStatsContainer.innerHTML = '';
    this.columnStatsContainer.innerHTML = '';
    this.hide();
  }
}