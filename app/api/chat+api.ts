import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are the PlacementPro AI Assistant, a helpful, encouraging, and accurate chatbot designed to help college students with their placement and campus recruitment queries.

Your knowledge includes, but is not limited to:
- Eligibility & Criteria (CGPA cutoffs, backlogs, branch restrictions)
- Drives & Schedules (interview timings, venues, required documents)
- Resumes & Profiles (Resume Wizard formats, updating details, uploading)
- Application Statuses (tracking, shortlists, offer acceptance)
- Salary & Offers (average packages, bonds, probation, negotiation)
- Skill Guidance (required skills for roles like Data Analyst, SDE, Cybersecurity; interview prep, coding practice)
- Emergency / Confusion (missing interviews, forgetting passwords, nervousness)

Guidelines for your responses:
1. Be concise, direct, and helpful. Use short paragraphs or bullet points when listing things.
2. Maintain a professional yet warm and encouraging college-mentor tone.
3. If asked about a specific company's criteria that you are unsure of, advise the user to "check the specific drive details in the dashboard".
4. If a user asks a complex question (e.g., combining CGPA and backlogs), logically synthesize an answer based on general rules.
5. If the user asks something completely unrelated to college, placements, careers, or academics, politely redirect them back to placement topics.

You are interacting directly with students via a mobile app interface.`;

// A simple dictionary for the bot's static Q&A fallback when API quota is exceeded
const FALLBACK_Q_AND_A: Record<string, string> = {
    "hello": "Hi there! I am your PlacementPro assistant. How can I help you today?",
    "hi": "Hi there! I am your Placement assistant. How can I help you today?",
    "eligible": "Eligibility depends on CGPA, backlogs, branch, and company criteria. Please check drive details.",
    "cgpa": "CGPA requirements vary by company, usually between 6.0 and 7.5.",
    "backlog": "Some companies allow backlogs; others require zero active backlogs.",
    "interview": "Check your Application Tracker for interview slot details.",
    "aptitude": "Aptitude test timings are mentioned in your dashboard notifications.",
    "venue": "Venue details are updated in the drive section.",
    "resume": "To update your resume, go to the Profile tab and tap 'Edit Profile'.",
    "package": "Package details are mentioned in the drive description (Average is ₹4–6 LPA).",
    "salary": "Package details are mentioned in the drive description (Average is ₹4–6 LPA).",
    "highest": "Current highest package: ₹15 LPA.",
    "skills": "Focus on DSA, your core subjects, and communication skills.",
    "prepare": "Practice daily mock tests and revise core subjects.",
    "contact": "If you need support, please contact the Placement Cell.",
    "default": "I'm here to help with Placement queries! You can ask me about Eligibility, Drive Schedules, Salary Packages, or Resume tips."
};

function getFallbackResponse(userMessage: string): string {
    const lowerInput = userMessage.toLowerCase();
    for (const keyword of Object.keys(FALLBACK_Q_AND_A)) {
        if (keyword !== "default" && lowerInput.includes(keyword)) {
            return FALLBACK_Q_AND_A[keyword];
        }
    }
    return FALLBACK_Q_AND_A["default"];
}

export async function POST(request: Request) {
    let userMessageText = "";
    try {
        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return Response.json({ error: 'Invalid message format' }, { status: 400 });
        }

        // Extract the last user message early for the fallback
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.isUser) {
            userMessageText = lastMsg.text;
        }

        const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

        if (!groqApiKey) {
            console.warn('Groq API key not set, using fallback.');
            return Response.json({ text: getFallbackResponse(userMessageText) });
        }

        // Build the messages array in OpenAI-compatible format for Groq
        const groqMessages = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...messages.map((msg: any) => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text,
            })),
        ];

        // Call the Groq API (it's OpenAI-compatible, so we use a simple fetch)
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Fast, powerful, and free on Groq
                messages: groqMessages,
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!groqResponse.ok) {
            const errorBody = await groqResponse.text();
            console.error(`Groq API error ${groqResponse.status}:`, errorBody);
            throw new Error(`Groq API returned status: ${groqResponse.status}`);
        }

        const groqData = await groqResponse.json();
        const aiText = groqData.choices?.[0]?.message?.content || getFallbackResponse(userMessageText);

        return Response.json({ text: aiText });

    } catch (error) {
        console.error('Error in chat API, using fallback:', error);
        return Response.json({ text: getFallbackResponse(userMessageText) });
    }
}
