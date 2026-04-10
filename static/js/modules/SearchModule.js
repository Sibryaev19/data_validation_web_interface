/**
 * Module 1: Table Search
 * Handles table name input and API request to /api/table-info
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
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    // Clear error on input
    this.input.addEventListener('input', () => this.hideError());
  }

  async handleSearch() {
    const tableName = this.input.value.trim();

    if (!tableName) {
      this.showError('Введите название таблицы');
      this.input.focus();
      return;
    }

    this.setLoading(true);
    this.hideError();

    try {
      const data = await apiPost('/api/table-info', { tableName });
      this.onSuccess(data, tableName);
    } catch (error) {
      console.error('Search error:', error);
      const message = this.getErrorMessage(error);
      this.showError(message);
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

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  hideError() {
    this.errorEl.hidden = true;
  }

  getErrorMessage(error) {
    if (error?.status === 404) return 'Таблица не найдена';
    if (error?.status === 400) return error.message || 'Некорректный запрос';
    if (error?.status >= 500) return 'Ошибка сервера. Попробуйте позже';
    return error?.message || 'Произошла ошибка при поиске';
  }

  reset() {
    this.setLoading(false);
    this.input.value = '';
    this.hideError();
    this.input.focus();
  }

  focus() {
    this.input.focus();
  }
}