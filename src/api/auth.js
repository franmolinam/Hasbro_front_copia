const API_URL = "https://hasbro-back-252s2.onrender.com";

export async function login(email, password) {
  const res = await fetch(`${API_URL}/autenticacion/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signup(nombre, email, password) {
  const res = await fetch(`${API_URL}/autenticacion/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  return res.json();
}
