// API Route: /api/mock-test
// Handles two actions from the mock test screen:
//   1. "generate" - given skill topics, return N multiple-choice questions
//   2. "evaluate"  - given a question and user answer, return correctness + explanation

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
    const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!groqApiKey) throw new Error('GROQ API key not set');

    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: 2000,
            temperature: 0.5,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, skills, numberOfQuestions, question, userAnswer } = body;

        // ----- Action 1: Generate questions -----
        if (action === 'generate') {
            const skillList = Array.isArray(skills) ? skills.join(', ') : skills;
            const n = numberOfQuestions ?? 5;

            const systemPrompt = `You are an expert technical interviewer. Generate concise multiple-choice questions for a mock placement test. Always respond with ONLY valid JSON, no extra text.`;

            const prompt = `Generate exactly ${n} multiple-choice questions testing the following skills: ${skillList}.

Return a JSON array with this exact shape (no markdown fencing, no extra text):
[
  {
    "id": 1,
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "explanation": "Brief explanation of why the answer is correct."
  },
  ...
]

Rules:
- Each question must have EXACTLY 4 options.
- correctIndex is 0-based (0 = option A, 1 = B, etc.).
- Keep questions practical, beginner-to-intermediate level.
- Do NOT include any text before or after the JSON array.`;

            const raw = await callGroq(prompt, systemPrompt);

            // Extract JSON array from the response
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('AI did not return a valid JSON array');

            const questions = JSON.parse(match[0]);
            return Response.json({ questions });
        }

        // ----- Action 2: Not needed – evaluation is done client-side using correctIndex -----
        return Response.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error: any) {
        console.error('Mock test API error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
