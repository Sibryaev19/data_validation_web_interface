/**
 * Module 3: Statistics Visualization
 * Renders metadata and column statistics tables
 */
export class ValidationResultsModule {
  constructor() {
    this.module = document.getElementById('resultsModule');
    this.metadataContainer = document.getElementById('metadataTableContainer');
    this.columnStatsContainer = document.getElementById('columnStatsTableContainer');
  }

  /**
   * Render statistics from API response
   * @param {Object} data - Response from /api/validate
   */
  render(data) {
    this.renderMetadata(data.table_metadata_statistics);
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

  renderColumnStats(stats) {
    if (!stats || Object.keys(stats).length === 0) {
      this.columnStatsContainer.innerHTML = '<p>Нет данных</p>';
      return;
    }
    const columns = Object.keys(stats);
    const allMetrics = [...new Set(
      columns.flatMap(col => Object.keys(stats[col]))
    )];

    // Фиксированный порядок метрик + новые спец. поля
    const metricOrder = ['type', 'count', 'null_percent', 'min', 'max', 'avg', 'std', 'unique', 'type_special', 'custom'];
    const orderedMetrics = [
      ...metricOrder.filter(m => allMetrics.includes(m)),
      ...allMetrics.filter(m => !metricOrder.includes(m))
    ];

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
      count: 'Записей',
      null_percent: '% NULL',
      min: 'Мин',
      max: 'Макс',
      avg: 'Среднее',
      std: 'Стд. откл.',
      unique: 'Уникальных',
      type: 'Тип данных',
      type_special: 'Спец. проверки',
      custom: 'Кастомные проверки'
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

    // custom: массив пар [[name, val], ...]
    if (Array.isArray(value)) {
      return value.map(([name, val]) => {
        const safeName = this.escapeHtml(String(name));
        const safeVal = typeof val === 'number'
          ? val.toLocaleString('ru-RU', { maximumFractionDigits: 4 })
          : this.escapeHtml(String(val ?? '—'));
        return `<div class="custom-check"><span class="custom-name">${safeName}:</span> <span class="custom-val">${safeVal}</span></div>`;
      }).join('');
    }

    // type_special: объект { key: val, ... }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).map(([k, v]) => {
        const safeKey = this.escapeHtml(String(k));
        const safeVal = typeof v === 'number'
          ? v.toLocaleString('ru-RU', { maximumFractionDigits: 4 })
          : this.escapeHtml(String(v ?? '—'));
        return `<div class="special-check"><span class="special-key">${safeKey}:</span> <span class="special-val">${safeVal}</span></div>`;
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
    this.columnStatsContainer.innerHTML = this.getColumnStatsSkeletonHTML();
    this.show();
  }

  // ✅ Исправлен синтаксис: был Markdown, теперь валидный HTML
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
    this.columnStatsContainer.innerHTML = '';
    this.hide();
  }
}