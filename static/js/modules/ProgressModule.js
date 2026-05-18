export class ProgressModule {
  constructor() {
    this.module = document.getElementById('progressModule');
    this.tbody = document.getElementById('progressTableBody');
    this.stages = [
      { id: 'metadata', name: 'Обработка метаданных' },
      { id: 'sample', name: 'Получение сэмпла данных' },
      { id: 'validation', name: 'Валидация данных' },
      { id: 'gigachat', name: 'Рекомендации GigaChat' }
    ];
    this.state = this.initState();
  }

  initState() {
    return this.stages.map(s => ({ ...s, status: 'pending', elapsed: null, error: null, startTime: null, timerInterval: null }));
  }

  show() { this.render(); this.module.hidden = false; this.module.classList.add('active'); }
  hide() { this.module.hidden = true; this.module.classList.remove('active'); this.stopAllTimers(); }

  reset() { this.stopAllTimers(); this.state = this.initState(); this.render(); }

  stopAllTimers() { this.state.forEach(s => { if (s.timerInterval) clearInterval(s.timerInterval); s.timerInterval = null; }); }

  // Сохранение/восстановление
  getState() {
    return this.state.map(s => ({
      id: s.id, status: s.status, elapsed: s.elapsed, error: s.error
    }));
  }

  restoreState(savedState) {
    if (!savedState || savedState.length === 0) { this.reset(); return; }
    this.stopAllTimers();
    this.state = savedState.map(s => ({ ...this.stages.find(st => st.id === s.id), ...s, startTime: null, timerInterval: null }));

    // Если статус running, перезапускаем таймер
    this.state.forEach(stage => {
      if (stage.status === 'running') {
        stage.startTime = Date.now() - (stage.elapsed || 0) * 1000;
        this.startTimer(stage);
      }
    });
    this.render();
    if (this.module.classList.contains('active')) this.show();
  }

  updateFromEvent(eventData) {
    const { stage, status, elapsed, error } = eventData;
    const stageObj = this.state.find(s => s.id === stage);
    if (!stageObj) return;

    const prevStatus = stageObj.status;
    Object.assign(stageObj, { status, elapsed: elapsed ?? stageObj.elapsed, error: error ?? stageObj.error });

    if (status === 'running' && prevStatus !== 'running') {
      stageObj.startTime = Date.now();
      this.startTimer(stageObj);
    } else if (status !== 'running' && stageObj.timerInterval) {
      clearInterval(stageObj.timerInterval);
      stageObj.timerInterval = null;
    }
    if (status === 'error' && stageObj.timerInterval) {
      clearInterval(stageObj.timerInterval);
      stageObj.timerInterval = null;
    }
    this.renderRow(stageObj);
  }
  startTimer(stageObj) {
    stageObj.timerInterval = setInterval(() => {
      if (stageObj.status === 'running' && stageObj.startTime) {
        stageObj.elapsed = (Date.now() - stageObj.startTime) / 1000;
        this.renderRow(stageObj);
      } else {
        clearInterval(stageObj.timerInterval);
        stageObj.timerInterval = null;
      }
    }, 100);
  }

  render() {
    if (!this.tbody) return;
    // Полная перерисовка всей таблицы (используется только при reset/show)
    this.tbody.innerHTML = '';
    this.state.forEach(stage => {
      const row = document.createElement('tr');
      row.id = `progress-row-${stage.id}`;
      row.innerHTML = `
        <td>${stage.name}</td>
        <td class="status-cell"></td>
        <td class="time-cell"></td>
      `;
      this.tbody.appendChild(row);
      this.updateRowContent(row, stage);
    });
  }

  renderRow(stage) {
    const row = document.getElementById(`progress-row-${stage.id}`);
    if (!row) return;
    this.updateRowContent(row, stage);
  }

  updateRowContent(row, stage) {
    const statusCell = row.querySelector('.status-cell');
    const timeCell = row.querySelector('.time-cell');
    if (!statusCell || !timeCell) return;

    // Обновляем статус с учётом, что спиннер не должен пересоздаваться
    const currentStatusHtml = this.getStatusHtml(stage);
    if (statusCell.innerHTML !== currentStatusHtml) {
      statusCell.innerHTML = currentStatusHtml;
    }

    // Время обновляем всегда
    timeCell.textContent = this.getTimeText(stage);
  }

  getStatusHtml(stage) {
    switch (stage.status) {
      case 'pending':
        return '⏳ В очереди';
      case 'running':
        // Спиннер как отдельный элемент, текст "Выполняется" не меняется
        return '<span class="progress-spinner"></span> Выполняется';
      case 'completed':
        return '✅ Завершено';
      case 'error':
        return `❌ Ошибка${stage.error ? `: ${stage.error}` : ''}`;
      default:
        return '';
    }
  }

  getTimeText(stage) {
    if (stage.status === 'pending') return '—';
    if (stage.elapsed !== null) {
      return `${stage.elapsed.toFixed(1)} сек`;
    }
    return '—';
  }

  setStageError(stageId, errorMessage) {
    const stage = this.state.find(s => s.id === stageId);
    if (stage) {
      stage.status = 'error';
      stage.error = errorMessage;
      this.renderRow(stage);
    }
  }
}