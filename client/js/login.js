document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = document.getElementById("correo").value;
  const password = document.getElementById("password").value;
  const mensaje = document.getElementById("mensaje");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    const data = await res.json();

    if (res.ok) {
      mensaje.textContent = "Bienvenido " + data.nombre;
      mensaje.style.color = "green";

      if (data.rol === "ADMIN") {
        window.location.href = "/admin.html";
      } else {
        window.location.href = "/empleado.html";
      }
    } else {
      mensaje.textContent = data.message;
      mensaje.style.color = "red";
    }
  } catch (err) {
    mensaje.textContent = "Error al conectar con el servidor.";
    mensaje.style.color = "red";
  }
});
