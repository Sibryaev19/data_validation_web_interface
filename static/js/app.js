import { SearchModule } from './modules/SearchModule.js';
import { TableConfigModule } from './modules/TableConfigModule.js';
import { ValidationResultsModule } from './modules/ValidationResultsModule.js';
import { GigaChatTipsModule } from './modules/GigaChatTipsModule.js';
import { ProgressModule } from './modules/ProgressModule.js';
import { TabManager } from './modules/TabManager.js';
import { closeConditionModal } from './utils/modal.js';

class App {
  constructor() {
    this.resetBtn = document.getElementById('resetBtn');

    this.modules = {
      results: new ValidationResultsModule(),
      tips: new GigaChatTipsModule(),
      progress: new ProgressModule(),
      config: new TableConfigModule(),
      search: new SearchModule(
        (data, tableName) => this.handleTableFound(data, tableName),
        (error) => console.warn('Search error:', error)
      )
    };

    this.tabManager = new TabManager(this);
    this.init();
  }

  init() {
    this.resetBtn.addEventListener('click', () => this.handleFullReset());
    this.modules.config.hide();
    this.modules.search.focus();
  }

  handleTableFound(tableInfo, tableName) {
    this.resetBtn.hidden = false;
    this.tabManager.addTab(tableName, tableInfo.columns);
  }

  handleFullReset() {
    closeConditionModal();
    this.tabManager.resetAll();
    this.modules.search.reset();
  }

  resetUI() {
    closeConditionModal();
    this.modules.results.clear();
    this.modules.tips.clear();
    this.modules.progress.reset();
    this.modules.progress.hide();
    this.modules.config.hide();
    this.resetBtn.hidden = true;
    this.modules.search.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});