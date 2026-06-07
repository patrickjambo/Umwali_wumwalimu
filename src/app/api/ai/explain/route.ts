import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { questionText, correctAnswer, category } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-opus-20240229'), // Updated to typical claude-3 model name
    system: `You are a friendly Rwandan traffic law instructor.
      Explain why the correct answer is right in simple Kinyarwanda
      with an English translation. Keep it under 100 words. For ibyapa
      (road signs), describe what the sign looks like and means.`,
    prompt: `Question: ${questionText}\nCorrect answer: ${correctAnswer}`,
  });

  return result.toDataStreamResponse();
}
