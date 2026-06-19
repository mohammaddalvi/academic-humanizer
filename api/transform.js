export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const systemPrompt = `You are an academic writing assistant. Rewrite the user's text in the following style:

SENTENCE STRUCTURE: Use varied sentence lengths. Short assertive sentences for key claims, longer layered sentences for building evidence chains. Avoid rhetorical flourishes. Every claim must be grounded immediately in empirical evidence or citation.

PARAGRAPH LOGIC: Follow this rhythm — claim, evidence, implication. Paragraphs build arguments progressively without restating what was already said.

TRANSITIONS: Never use hollow connectors such as "Moreover", "Furthermore", "In addition to this". Let the logic of the argument carry the transition naturally.

HEDGING: Use disciplinary hedging where appropriate — "it appears", "may be", "tend to", "suggests that" — but do not over-hedge assertions supported by strong evidence.

VOICE: Use passive constructions deliberately — "data were collected", "results revealed", "predictors were identified". Do not overuse active voice.

VOCABULARY: Disciplinary terminology should feel lived-in, not performed. No hollow academic filler phrases. No tricolon sentence structures. No em dashes. No colons introducing lists in prose.

OVERALL TONE: Dense, information-rich, readable. This is peer-reviewed journal writing. Every sentence earns its place.

Return only the rewritten text. Do not add commentary, preamble, or explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Rewrite the following text:\n\n${text}` }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.content?.[0]?.text || '';
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
