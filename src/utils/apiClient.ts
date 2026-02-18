import { supabase } from "./supabaseClient";

export async function apiRequest(path: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(path, {
        ...options,
        headers,
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Something went wrong");
        }
        return data;
    }

    if (!response.ok) {
        throw new Error("Something went wrong");
    }

    return response;
}

export const api = {
    get: (path: string) => apiRequest(path, { method: "GET" }),
    post: (path: string, body: any) => apiRequest(path, { method: "POST", body: JSON.stringify(body) }),
    postForm: (path: string, body: FormData) => apiRequest(path, { method: "POST", body }),
    patch: (path: string, body: any) => apiRequest(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (path: string) => apiRequest(path, { method: "DELETE" }),
};
