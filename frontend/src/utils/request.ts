export async function request<T>(url: string, options: RequestInit, numberOfRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= numberOfRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Request aborted");
        throw error; // Rethrow the abort error to be handled by the caller
      }

      if (attempt === numberOfRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }

  return Promise.reject(new Error('Request failed after maximum retries'));
}
