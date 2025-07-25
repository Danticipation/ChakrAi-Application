import { QueryClient } from '@tanstack/react-query';

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Default fetch function for react-query
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
  const url = queryKey[0] as string;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Set default query function
queryClient.setQueryDefaults([''], { queryFn: defaultQueryFn });

// API request helper function for mutations
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} ${error}`);
  }

  // Handle different content types
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

export default queryClient;