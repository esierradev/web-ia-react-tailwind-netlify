// netlify/functions/gemini.js

export const handler = async (event) => {
  // Ya NO se requiere la línea 'const fetch = require("node-fetch");'
  const API_KEY = process.env.GEMINI_API_KEY;

  let text;
  try {
    const body = JSON.parse(event.body);
    text = body.text;
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Solicitud JSON inválida." }),
    };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "Error interno: La clave GEMINI_API_KEY no está configurada en Netlify.",
      }),
    };
  }

  if (!text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "El campo 'text' está vacío." }),
    };
  }

  try {
    // Usamos el fetch global y nativo de Netlify
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errorMessage =
        data.error?.message || "Error desconocido de la API.";

      return {
        statusCode: res.status,
        body: JSON.stringify({
          error: `Error de la API de Gemini (${res.status}): ${errorMessage}`,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Fallo de red o error de servidor. Revisa logs de Netlify.",
        details: error.message,
      }),
    };
  }
};
