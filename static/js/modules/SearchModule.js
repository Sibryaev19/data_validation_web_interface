/**
Module 1: Table Search
*/
import { apiPost } from '../utils/api.js';

export class SearchModule {
  constructor(onSuccess, onError) {
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.input = document.getElementById('tableNameInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.spinner = document.getElementById('searchSpinner');
    this.errorEl = document.getElementById('searchError');
    this.init();
  }

  init() {
    this.searchBtn.addEventListener('click', () => this.handleSearch());
    this.input.addEventListener('keydown', (e) => e.key === 'Enter' && this.handleSearch());
    this.input.addEventListener('input', () => this.hideError());
  }

  async handleSearch() {
    const tableName = this.input.value.trim();
    if (!tableName) {
      this.showError('Введите название таблицы');
      this.input.focus();
      return;
    }
    // УБРАН полный сброс модулей!

    this.setLoading(true);
    this.hideError();
    try {
      const data = await apiPost('/api/table-info', { tableName });
      this.onSuccess(data, tableName);
      // НЕ очищаем input, чтобы можно было быстро найти соседнюю таблицу
    } catch (error) {
      this.showError(this.getErrorMessage(error));
      this.onError?.(error);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.input.disabled = loading;
    this.searchBtn.disabled = loading;
    this.spinner.hidden = !loading;
  }
  showError(message) { this.errorEl.textContent = message; this.errorEl.hidden = false; }
  hideError() { this.errorEl.hidden = true; }
  getErrorMessage(error) {
    if (error?.status === 404) return 'Таблица не найдена';
    if (error?.status >= 500) return 'Ошибка сервера';
    return error?.message || 'Произошла ошибка';
  }
  reset() {
    this.setLoading(false);
    this.input.value = '';
    this.hideError();
    this.input.focus();
  }
  focus() { this.input.focus(); }
}