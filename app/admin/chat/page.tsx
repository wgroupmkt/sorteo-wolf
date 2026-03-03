"use client";

import { useState } from "react";

export default function AdminChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!question.trim()) return;

    const userMessage = { role: "user" as const, content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      const botMessage = {
        role: "assistant" as const,
        content: data.answer || "No hubo respuesta.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al consultar el servidor." },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-md p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-4 text-black">
          Chat Admin - Base de Datos
        </h1>

        <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm">
              Hacé una pregunta sobre los vendedores o participantes.
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <p className="text-sm text-gray-500">Consultando...</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ej: ¿Cuántos participantes hay en total?"
            className="flex-1 border p-2 rounded text-black"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-black text-white px-4 rounded hover:bg-gray-800"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}