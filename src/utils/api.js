import useConnectionStore from '../store/useConnectionStore';

export const getHostUrl = () => {
  const { serverUrl } = useConnectionStore.getState();
  if (serverUrl) {
    return serverUrl.replace(/\/$/, '');
  }
  return `http://${window.location.hostname}:8000`;
};

export const getApiBaseUrl = () => {
  return `${getHostUrl()}/api`;
};


export async function fetchApi(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const { apiKey } = useConnectionStore.getState();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // If we are passing JSON (and it's not FormData), add content-type
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMsg = `HTTP error! status: ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.detail || errorMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
