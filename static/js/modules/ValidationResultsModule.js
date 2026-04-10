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
            <td>${this.formatValue(value)}</td>
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

    // Fixed order for common metrics
    const metricOrder = ['count', 'null_percent', 'min', 'max', 'avg', 'std', 'unique'];
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
    };
    return names[name] || name;
  }

  formatValue(value) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString('ru-RU');
      return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    }
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
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

  /**
   * Генерирует скелетон для таблицы метаданных
   */
  getMetadataSkeletonHTML() {
    return `
      <table class="stats-table skeleton-table">
        <thead>
          <tr>
            <th>Параметр</th>
            <th>Описание</th>
            <th>Значение</th>
          </tr>
        </thead>
        <tbody>
          ${Array(5).fill(0).map(() => `
            <tr class="skeleton-row">
              <td class="skeleton-cell"><div class="skeleton-line" style="width: 120px"></div></td>
              <td class="skeleton-cell"><div class="skeleton-line" style="width: 180px"></div></td>
              <td class="skeleton-cell"><div class="skeleton-line" style="width: 80px"></div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Генерирует скелетон для таблицы статистики по колонкам
   */
  getColumnStatsSkeletonHTML() {
    const columnCount = 8; // Примерное количество метрик
    return `
      <table class="stats-table skeleton-table">
        <thead>
          <tr>
            <th>Колонка</th>
            ${Array(columnCount).fill(0).map((_, i) => `
              <th><div class="skeleton-line" style="width: 60px"></div></th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${Array(6).fill(0).map(() => `
            <tr class="skeleton-row">
              <td class="skeleton-cell"><div class="skeleton-line" style="width: 100px"></div></td>
              ${Array(columnCount).fill(0).map(() => `
                <td class="skeleton-cell"><div class="skeleton-line" style="width: 50px"></div></td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Очистить скелетоны и скрыть модуль
   */
  clear() {
    this.metadataContainer.innerHTML = '';
    this.columnStatsContainer.innerHTML = '';
    this.hide();
  }
}