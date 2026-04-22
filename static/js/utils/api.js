/**
 * API helper functions for making requests to backend
 */

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response JSON
 */
export async function apiPost(endpoint, data) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.message || `HTTP error ${response.status}`,
      details: errorData,
    };
  }

  return response.json();
}

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} Response JSON
 */
export async function apiGet(endpoint) {
  const response = await fetch(endpoint);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.message || `HTTP error ${response.status}`,
      details: errorData,
    };
  }

  return response.json();
}

// api.js – добавьте после существующих функций

/**
 * Отправить POST запрос с поддержкой стриминга прогресса
 * @param {string} endpoint - эндпоинт
 * @param {Object} data - тело запроса
 * @param {Function} onProgress - колбэк для событий прогресса (вызывается с объектом события)
 * @returns {Promise<Object>} - финальный результат
 */
export async function apiPostStream(endpoint, data, onProgress) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.message || `HTTP error ${response.status}`,
      details: errorData,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // неполная строка остаётся в буфере

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.event === 'progress') {
            onProgress(parsed);
          } else if (parsed.event === 'result') {
            // Это финальный результат, возвращаем его
            return parsed.data;
          } else {
            // На случай, если сервер просто шлёт объекты без поля event
            // предполагаем, что последний объект – результат
            console.warn('Unexpected event:', parsed);
          }
        } catch (e) {
          console.error('Failed to parse stream line:', line, e);
        }
      }
    }

    // После завершения потока проверим остаток буфера
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.event === 'result') {
          return parsed.data;
        }
      } catch (e) {
        console.error('Failed to parse final buffer:', buffer, e);
      }
    }

    throw new Error('Stream ended without result event');
  } finally {
    reader.releaseLock();
  }
}