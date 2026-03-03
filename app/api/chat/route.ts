import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/firebaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const promotersRef = db.collection("promoters");

    // 🔎 Detectar si la pregunta incluye un DNI (número de 7-8 dígitos)
    const dniMatch = question.match(/\b\d{7,8}\b/);

    if (dniMatch) {
      const dni = dniMatch[0];

      const doc = await promotersRef.doc(dni).get();

      if (!doc.exists) {
        return NextResponse.json({
          answer: `No existe un promotor con DNI ${dni}.`,
        });
      }

      const data = doc.data();

      return NextResponse.json({
        answer: `El promotor ${dni} tiene ${data?.totalParticipants || 0} participantes registrados.`,
      });
    }

    // 🔥 Si pregunta general
    const promotersSnap = await promotersRef.get();

    let totalParticipants = 0;

    promotersSnap.forEach((doc) => {
      totalParticipants += doc.data().totalParticipants || 0;
    });

    const context = `
    Datos actuales del sistema:
    - Total promotores registrados: ${promotersSnap.size}
    - Total participantes registrados: ${totalParticipants}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Sos un asistente administrativo que responde sobre un sistema de sorteos.",
        },
        {
          role: "user",
          content: `${context}\n\nPregunta: ${question}`,
        },
      ],
      temperature: 0.3,
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("ERROR EN /api/chat:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}