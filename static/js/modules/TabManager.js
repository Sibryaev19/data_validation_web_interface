export class TabManager {
  constructor(app) {
    this.app = app;
    this.tabs = new Map();
    this.activeTabId = null;
    this.validationQueue = [];
    this.isValidationRunning = false;
    this.idCounter = 0;

    this.container = document.getElementById('tabsContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'tabsContainer';
      this.container.className = 'tabs-container';
      document.getElementById('searchModule').after(this.container);
    }
    // УБРАН дублирующий слушатель validateBtn. Теперь TableConfigModule делегирует запуск сюда.
  }

  addTab(tableName, columns) {
    const id = `tab_${++this.idCounter}`;
    const context = {
        id, tableName, columns,
        conditions: {}, rowLimit: 10000000,
        computeMode: 'all', skipGigaChat: false, // 👇 ДОБАВЛЕНО
        resultsData: null, tipsData: null,
        progressState: [], status: 'idle'
    };
    this.tabs.set(id, context);
    this.renderTabButton(context);
    this.switchTab(id);
  }

  switchTab(id) {
    if (this.activeTabId === id) return;
    this.saveActiveTabState();
    this.activeTabId = id;
    this.updateTabUI();
    this.restoreTabState(id);
    this.updateModuleVisibility();
  }

  closeTab(id) {
    this.validationQueue = this.validationQueue.filter(qId => qId !== id);
    this.tabs.delete(id);
    document.querySelector(`.tab-btn[data-tab-id="${id}"]`)?.remove();
    if (this.activeTabId === id) {
      this.activeTabId = this.tabs.size ? Array.from(this.tabs.keys()).pop() : null;
      if (this.activeTabId) this.switchTab(this.activeTabId);
      else this.app.resetUI();
    }
  }

  requestValidation(id) {
    const ctx = this.tabs.get(id);
    if (!ctx) return;

    // 👇 Синхронизируем актуальные значения из UI в контекст перед запуском
    ctx.conditions = this.app.modules.config.getConditions();
    ctx.rowLimit = this.app.modules.config.getRowLimit();
    ctx.computeMode = this.app.modules.config.getComputeMode();
    ctx.skipGigaChat = this.app.modules.config.getSkipGigaChat();

    if (this.isValidationRunning) {
        if (!this.validationQueue.includes(id)) this.validationQueue.push(id);
        ctx.status = 'queued';
        this.updateTabBadge(id);
        return;
    }
    this.startValidation(id);
  }

  async startValidation(id) {
    this.isValidationRunning = true;
    const ctx = this.tabs.get(id);
    ctx.status = 'running';
    ctx.progressState = [];
    this.updateTabBadge(id);
    this.updateModuleVisibility();

    const payload = {
        tableName: ctx.tableName,
        rowLimit: ctx.rowLimit,
        columnConditions: ctx.conditions,
        computeMode: ctx.computeMode,   // 👇 ДОБАВЛЕНО
        skipGigaChat: ctx.skipGigaChat  // 👇 ДОБАВЛЕНО
    };

    try {
      const finalData = await this.app.modules.config.runValidationStream(
        payload,
        (progressEvent) => this.app.modules.progress.updateFromEvent(progressEvent)
      );
      ctx.resultsData = finalData;
      ctx.tipsData = finalData.gigachat_tips;
      ctx.status = 'completed';
      if (this.app.modules.progress?.getState) ctx.progressState = this.app.modules.progress.getState();
      this.app.modules.results.render(finalData);
      this.app.modules.tips.render(finalData.gigachat_tips);
    } catch (error) {
      ctx.status = 'error';
      if (this.app.modules.progress?.getState) ctx.progressState = this.app.modules.progress.getState();
      console.error('Validation error:', error);
    } finally {
      this.isValidationRunning = false;
      this.updateTabBadge(id);
      this.updateModuleVisibility();
      this.processQueue();
    }
  }

  processQueue() {
    if (this.validationQueue.length > 0 && !this.isValidationRunning) {
      this.startValidation(this.validationQueue.shift());
    }
  }

  saveActiveTabState() {
      if (!this.activeTabId || !this.tabs.has(this.activeTabId)) return;
      const ctx = this.tabs.get(this.activeTabId);
      ctx.conditions = this.app.modules.config.getConditions();
      ctx.rowLimit = this.app.modules.config.getRowLimit();
      ctx.computeMode = this.app.modules.config.getComputeMode(); // 👇 ДОБАВЛЕНО
      ctx.skipGigaChat = this.app.modules.config.getSkipGigaChat(); // 👇 ДОБАВЛЕНО
      if (this.app.modules.progress?.getState) ctx.progressState = this.app.modules.progress.getState();
  }

    restoreTabState(id) {
        const ctx = this.tabs.get(id);
        if (!ctx) return;
        this.app.modules.config.restoreState(
            ctx.tableName, ctx.columns, ctx.conditions, ctx.rowLimit,
            ctx.computeMode, ctx.skipGigaChat // 👇 ДОБАВЛЕНЫ АРГУМЕНТЫ
        );
        if (this.app.modules.progress?.restoreState) this.app.modules.progress.restoreState(ctx.progressState);
        if (ctx.resultsData) this.app.modules.results.render(ctx.resultsData);
        else this.app.modules.results.clear();
        if (ctx.tipsData) this.app.modules.tips.render(ctx.tipsData);
        else this.app.modules.tips.clear();
    }

  updateTabUI() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tabId === this.activeTabId);
    });
  }

  updateTabBadge(id) {
    const ctx = this.tabs.get(id);
    const btn = document.querySelector(`.tab-btn[data-tab-id="${id}"]`);
    if (!btn || !ctx) return;
    const indicator = btn.querySelector('.tab-status-indicator');
    const badge = btn.querySelector('.tab-queue-badge');
    indicator.className = 'tab-status-indicator';
    badge.classList.add('hidden');

    switch (ctx.status) {
      case 'running': indicator.classList.add('status-running'); break;
      case 'queued':
        indicator.classList.add('status-queued');
        const idx = this.validationQueue.indexOf(id) + 1;
        if (idx > 0) { badge.textContent = idx; badge.classList.remove('hidden'); }
        break;
      case 'completed': indicator.classList.add('status-completed'); break;
      case 'error': indicator.classList.add('status-error'); break;
    }
  }

  renderTabButton(ctx) {
    const escapedName = this.escapeHtml(ctx.tableName);
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.tabId = ctx.id;

    // Та же логика, что и в TableConfigModule
    const useTooltip = ctx.tableName.length > 18;
    const nameHtml = useTooltip
      ? `<span class="tooltip">
           <span class="tab-text truncated-text" tabindex="0">${escapedName}</span>
           <span class="tooltip-text">${escapedName}</span>
         </span>`
      : `<span class="tab-text">${escapedName}</span>`;

    btn.innerHTML = `
      <span class="tab-status-indicator"></span>
      ${nameHtml}
      <span class="tab-queue-badge hidden"></span>
      <button class="tab-close" aria-label="Закрыть">×</button>
    `;

    btn.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) this.switchTab(ctx.id);
    });
    btn.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(ctx.id);
    });
    this.container.appendChild(btn);
    this.updateTabBadge(ctx.id);
  }

  updateModuleVisibility() {
    const ctx = this.tabs.get(this.activeTabId);
    if (!ctx) return;
    const { progress, config, results, tips } = this.app.modules;

    config.show();
    config.setValidationEnabled(this.activeTabId && !this.isValidationRunning && ctx.status !== 'queued');

    if (ctx.status === 'running' || ctx.status === 'queued') {
      progress.show(); results.hide(); tips.hide();
    } else if (ctx.status === 'completed' || ctx.status === 'error') {
      progress.hide(); results.show(); tips.show();
    } else {
      progress.hide(); results.hide(); tips.hide();
    }
  }

  resetAll() {
    this.tabs.clear();
    this.validationQueue = [];
    this.isValidationRunning = false;
    this.activeTabId = null;
    this.container.innerHTML = '';
    this.app.resetUI();
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}