/**
 * Module 4: GigaChat Tips
 * Renders Markdown-formatted recommendations
 */

import { renderMarkdown } from '../utils/markdown.js';

export class GigaChatTipsModule {
  constructor() {
    this.module = document.getElementById('tipsModule');
    this.contentEl = document.getElementById('gigachatContent');
  }

  /**
   * Render markdown tips
   * @param {string} markdown - Markdown text from API
   */
  render(markdown) {
    if (!markdown?.trim()) {
      this.contentEl.innerHTML = '<p>Рекомендации отсутствуют</p>';
    } else {
      this.contentEl.innerHTML = renderMarkdown(markdown);
    }
    this.show();
  }

  show() {
    this.module.hidden = false;
    this.module.classList.add('active');
  }

  hide() {
    this.module.hidden = true;
    this.module.classList.remove('active');
  }

  clear() {
    this.contentEl.innerHTML = '';
    this.hide();
  }
}