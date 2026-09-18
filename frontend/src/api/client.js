// Production API client with JWT handling & comprehensive HTTP status error mapping

const BASE_URL = '/api/v1';

const getToken = () => localStorage.getItem('token');

const request = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    let data = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Map HTTP status codes to user-friendly messages if backend message is missing
      let errorMessage = data.message;
      if (!errorMessage) {
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid request parameters or submission data.';
            break;
          case 401:
            errorMessage = 'Session expired or unauthorized. Please login again.';
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Notify window if auth token expired
            window.dispatchEvent(new Event('auth:unauthorized'));
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 409:
            errorMessage = 'A conflict occurred. Resource already exists.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
          default:
            errorMessage = 'Internal server error. Please try again later.';
            break;
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection or backend status.');
    }
    throw err;
  }
};

export const api = {
  get:    (path, opts)   => request(path, { method: 'GET',    ...opts }),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
};
