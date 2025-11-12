const API_URL = "https://hasbro-back-252s2.onrender.com";

export async function login(email, password, socketId = null) {
  const body = { email, password };
  if (socketId) body.socketId = socketId;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function signup(nombre, email, password) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  return res.json();
}
