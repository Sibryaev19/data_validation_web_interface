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

    this.state = this.stages.map(stage => ({
      ...stage,
      status: 'pending',
      elapsed: null,
      error: null,
      startTime: null,
      timerInterval: null
    }));
  }

  show() {
    this.render();
    this.module.hidden = false;
    this.module.classList.add('active');
  }

  hide() {
    this.module.hidden = true;
    this.module.classList.remove('active');
    this.stopAllTimers();
  }

  reset() {
    this.stopAllTimers();
    this.state.forEach(s => {
      s.status = 'pending';
      s.elapsed = null;
      s.error = null;
      s.startTime = null;
    });
    this.render();
  }

  stopAllTimers() {
    this.state.forEach(s => {
      if (s.timerInterval) {
        clearInterval(s.timerInterval);
        s.timerInterval = null;
      }
    });
  }

  updateFromEvent(eventData) {
    const { stage, status, elapsed, error } = eventData;
    const stageObj = this.state.find(s => s.id === stage);
    if (!stageObj) return;

    const previousStatus = stageObj.status;
    stageObj.status = status;
    if (elapsed !== undefined) stageObj.elapsed = elapsed;
    if (error) stageObj.error = error;

    if (status === 'running' && previousStatus !== 'running') {
      stageObj.startTime = Date.now();
      this.startTimer(stageObj);
    } else if (status !== 'running' && stageObj.timerInterval) {
      clearInterval(stageObj.timerInterval);
      stageObj.timerInterval = null;
      if (status === 'completed' && stageObj.elapsed === null && stageObj.startTime) {
        stageObj.elapsed = (Date.now() - stageObj.startTime) / 1000;
      }
    }

    if (status === 'error' && stageObj.timerInterval) {
      clearInterval(stageObj.timerInterval);
      stageObj.timerInterval = null;
    }

    // Обновляем только затронутую строку
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