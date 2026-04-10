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