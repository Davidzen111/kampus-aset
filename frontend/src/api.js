import { API_BASE, ROUTES } from "./config";


const read = k => localStorage.getItem(k) || sessionStorage.getItem(k);

export const getToken = () => read("token");

export function getUser() {
  try { return JSON.parse(read("user") || "null"); } catch { return null; }
}

export function clearSession() {
  ["token", "user"].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
}


export function saveSession(token, user, remember) {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem("token", token);
  store.setItem("user", JSON.stringify(user));
}


export function setStoredUser(u) {
  const store = localStorage.getItem("user") ? localStorage : sessionStorage;
  try { store.setItem("user", JSON.stringify(u)); } catch { /* abaikan */ }
}

function expired() {
  clearSession();
  location.replace(ROUTES.login);
  return new Error("Sesi berakhir");
}


export async function api(path, opts = {}) {
  const { json, ...rest } = opts;
  const headers = { Authorization: "Bearer " + getToken(), ...(rest.headers || {}) };
  let body = rest.body;
  if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  const res = await fetch(API_BASE + path, { ...rest, headers, body });
  if (res.status === 401) throw expired();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(typeof data.detail === "string" ? data.detail : "Permintaan gagal (" + res.status + ")");
    e.status = res.status; e.data = data;
    throw e;
  }
  return data;
}


export function explainError(err, fallback = "Permintaan gagal. Coba lagi.") {
  const d = err?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return "Periksa kembali data:\n" + d.map(x => `• ${(x.loc || []).filter(k => k !== "body" && k !== "query").join(".")}: ${x.msg}`).join("\n");
  }
  return err?.message || fallback;
}


export async function download(path, filename) {
  const res = await fetch(API_BASE + path, { headers: { Authorization: "Bearer " + getToken() } });
  if (res.status === 401) throw expired();
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(typeof d.detail === "string" ? d.detail : "Gagal mengunduh (" + res.status + ")");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
