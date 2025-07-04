// API base URL 설정
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// API URL을 생성하는 유틸리티 함수
export const getApiUrl = (endpoint) => {
  // endpoint가 이미 전체 URL인 경우 그대로 반환
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // endpoint가 /로 시작하지 않으면 / 추가
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  return `${API_BASE_URL}${normalizedEndpoint}`;
};

// fetch 래퍼 함수
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);

  // 토큰이 있으면 자동으로 헤더에 추가
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
