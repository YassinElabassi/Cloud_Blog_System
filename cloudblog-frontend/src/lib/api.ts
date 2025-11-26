export const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Tente de lire le corps de l'erreur JSON si disponible, sinon utilise le statut
    let errorDetail = `API Error: ${response.status}`;
    try {
        const errorData = await response.json();
        errorDetail = errorData.message || JSON.stringify(errorData);
    } catch (e) {
        // Le corps est vide ou non-JSON, on garde l'erreur de statut
    }
    throw new Error(errorDetail);
  }

  // FIX: Si le statut est 204 (No Content), ne pas essayer de lire le JSON.
  if (response.status === 204) {
    return null; 
  }

  // Pour tous les autres statuts OK (200, 201), lire le JSON.
  return response.json();
}