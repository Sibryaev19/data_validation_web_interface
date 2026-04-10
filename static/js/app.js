/**
 * Main Application Controller
 * Orchestrates module interaction and state management
 */

import { SearchModule } from './modules/SearchModule.js';
import { TableConfigModule } from './modules/TableConfigModule.js';
import { ValidationResultsModule } from './modules/ValidationResultsModule.js';
import { GigaChatTipsModule } from './modules/GigaChatTipsModule.js';

class App {
  constructor() {
    this.resetBtn = document.getElementById('resetBtn');
    this.modules = {};

    this.init();
  }

  init() {
    // Initialize result modules (hidden initially)
    this.modules.results = new ValidationResultsModule();
    this.modules.tips = new GigaChatTipsModule();

    // Initialize search module
    this.modules.search = new SearchModule(
      (data, tableName) => this.onTableFound(data, tableName),
      (error) => this.onSearchError(error)
    );

    // Reset button handler
    this.resetBtn.addEventListener('click', () => this.reset());

    // Focus search input on load
    this.modules.search.focus();
  }

  onTableFound(tableInfo, tableName) {
    // Hide search module visually (keep for reference)
    document.getElementById('searchModule').classList.remove('active');

    // Show reset button
    this.resetBtn.hidden = false;

    // Initialize and show config module
    this.modules.config = new TableConfigModule(
      tableName,
      tableInfo.columns,
      (validationData) => this.onValidationComplete(validationData)
    );
    this.modules.config.show();
  }

  onSearchError(error) {
    // Keep search module active, user can retry
    console.warn('Search failed:', error);
  }

  onValidationComplete(data) {
    // Collapse config section
    this.modules.config?.collapse();

    // Render results
    this.modules.results.render(data);
    this.modules.tips.render(data.gigachat_tips);

    // Scroll to results
    document.getElementById('resultsModule')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset() {
    // Очистка модулей
    this.modules.results?.clear();
    this.modules.tips?.clear();

    // Сброс поиска
    this.modules.search?.reset();
    const searchModule = document.getElementById('searchModule');
    searchModule.classList.add('active');   // возвращаем активный класс
    searchModule.removeAttribute('hidden'); // если был скрыт (не требуется, но для уверенности)

    // Скрываем конфигурацию
    if (this.modules.config) {
      this.modules.config.hide();
      delete this.modules.config;
    }

    this.resetBtn.hidden = true;
    this.modules.search?.focus();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});