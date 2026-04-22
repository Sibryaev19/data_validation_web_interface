import { SearchModule } from './modules/SearchModule.js';
import { TableConfigModule } from './modules/TableConfigModule.js';
import { ValidationResultsModule } from './modules/ValidationResultsModule.js';
import { GigaChatTipsModule } from './modules/GigaChatTipsModule.js';
import { closeConditionModal } from './utils/modal.js';
import { apiPost } from './utils/api.js';
import { ProgressModule } from './modules/ProgressModule.js';

class App {
  constructor() {
    this.resetBtn = document.getElementById('resetBtn');

    // Создаём модули
    this.modules = {
      results: new ValidationResultsModule(),
      tips: new GigaChatTipsModule(),
      progress: new ProgressModule(),
    };

    // config получает progress и колбэк завершения
    this.modules.config = new TableConfigModule(
      this.modules.progress,
      (finalData) => this.onValidationComplete(finalData)
    );

    this.modules.search = new SearchModule(
      (data, tableName) => this.handleTableFound(data, tableName),
      (error) => console.warn('Search error:', error)
    );

    this.init();
  }

  onValidationComplete(finalData) {
    // Скрываем прогресс-бар (или оставляем для истории)
    // this.modules.progress.hide();

    // Отображаем результаты и советы
    this.modules.results.render(finalData);
    this.modules.tips.render(finalData.gigachat_tips);

    document.getElementById('resultsModule')?.scrollIntoView({ behavior: 'smooth' });
  }

  init() {
    this.resetBtn.addEventListener('click', () => this.reset());
    this.modules.config.hide();
    this.modules.search.focus();
  }

  resetForNewSearch() {
    closeConditionModal();
    this.modules.results.clear();
    this.modules.tips.clear();
    this.modules.config.hide();
    this.modules.config.resetState();
  }

  handleTableFound(tableInfo, tableName) {
    document.getElementById('searchModule').classList.remove('active');
    this.resetBtn.hidden = false;

    this.modules.config.setTable(tableName, tableInfo.columns);
    this.modules.config.show();
  }

  async onValidate() {
    const payload = {
      tableName: this.modules.config.tableName,
      rowLimit: this.modules.config.getRowLimit(),
      columnConditions: this.modules.config.getConditions(),
    };

    try {
      const data = await apiPost('/api/validate', payload);
      this.modules.config.collapse();
      this.modules.results.render(data);
      this.modules.tips.render(data.gigachat_tips);
      document.getElementById('resultsModule')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Validation failed:', error);
      this.modules.config.showError(error.message || 'Ошибка валидации');
    } finally {
      this.modules.config.setLoading(false);
    }
  }

  reset() {
    closeConditionModal();
    this.modules.results.clear();
    this.modules.tips.clear();
    this.modules.progress.reset();
    this.modules.progress.hide();
    this.modules.config.reset();
    this.modules.search.reset();

    document.getElementById('searchModule').classList.add('active');
    this.resetBtn.hidden = true;
    this.modules.search.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});