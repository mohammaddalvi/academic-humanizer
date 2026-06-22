export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, pass, systemOverride } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  // If systemOverride is provided (used by v2 app), use it directly
  if (systemOverride) {
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
          max_tokens: 1500,
          system: systemOverride,
          messages: [{ role: 'user', content: text }]
        })
      });
      const data = await response.json();
      if (data.error) return res.status(500).json({ error: data.error.message });
      return res.status(200).json({ result: data.content?.[0]?.text || '' });
    } catch (err) {
      return res.status(500).json({ error: 'Something went wrong.' });
    }
  }

  const prompts = {

    1: `You are an academic writing assistant. This is PASS 1: DECONSTRUCT AND RECONSTRUCT.

Do not modify the text. Do not paraphrase it. Do not polish it.

Instead:

STEP 1 — READ AND UNDERSTAND
Read the provided text carefully. Identify the core argument of each paragraph, the key claims, the evidence and citations, and the logical flow.

STEP 2 — WRITE FROM SCRATCH
Write a completely new version of the same argument. Follow these rules:
- Do not use any phrase longer than four words that appeared in the original
- Express every idea in completely different words
- Keep all citations exactly as they appear but move them to different positions in sentences
- Write as a senior academic explaining this research in their own words to a colleague
- Mix long and short sentences deliberately
- Never use three-item parallel lists
- Use temporal anchors: "a decade ago", "in recent years", "since that episode"
- After a complex cited claim, add a short plain observation
- Never open sentences with: "Moreover", "Furthermore", "Additionally", "This shows", "Artificial intelligence is"
- Never use em dashes
- Let some paragraphs end on evidence without a closing summary sentence

Return only the reconstructed text. No commentary.`,

    2: `You are an academic writing assistant. This is PASS 2: VOCABULARY AUDIT.

Scan for any AI vocabulary that survived and replace it.

REPLACE EVERY INSTANCE OF:
- "epistemic" — rephrase around "knowledge" or "belief"
- "diffusion" — "spread" or "adoption"
- "acute" — "serious" or "significant"
- "penetration" — "entry into" or "presence in"
- "paramount" — "central" or "most important"
- "fundamentally altered" or "fundamentally transformed" — "changed" or "reshaped"
- "rapidly transforming" — rephrase with a temporal anchor
- "underscores" — "confirms" or "suggests"
- "delve" — "examine" or "look at"
- "it is evident that" — delete and state directly
- "myriad" — "many" or "a range of"
- "utilize" — "use"
- "facilitate" — "enable" or "help"
- "in order to" — "to"
- "tapestry" or "landscape" as metaphor — "context" or "environment"
- "testament" — "proof" or "evidence"
- "beacon" or "lighthouse" as metaphor — "model"
- "pivot" or "pivotal" — "crucial" or "central"
- "deceptively simple" — rephrase plainly
- "it is important to note" — delete and state directly
- "plays a crucial role" — rephrase directly
- standalone "This" starting a sentence — add specific noun after it
- Any sentence starting with "Moreover", "Furthermore", "Additionally", "Notably" — rewrite the opener
- Any three-item parallel list — break into separate sentences
- Any em dash — replace with comma or full stop
- Any sentence over 40 words — break it

Return only the cleaned text. No commentary.`,

    3: `You are an academic writing assistant. This is PASS 3: HUMAN VOICE INJECTION.

Make this text sound like a specific human writer: a senior academic who thinks carefully, writes with confidence, occasionally steps back to make a plain observation, and does not always wrap every point in a perfect bow.

INJECT THESE HUMAN PATTERNS:

1. EDITORIAL PUNCHES after dense cited sentences:
"What gets rewarded gets repeated."
"Confidence of this kind is not always warranted."
"That is, broadly speaking, how the learning works."
"The model learns by pleasing people."
"That authority is rarely questioned."
"This is a problem worth taking seriously."

2. UNRESOLVED TENSIONS:
"The evidence here is less clear than it might appear."
"Not all studies agree on this point, and the reasons for the discrepancy are not entirely settled."

3. DIGRESSIONS — brief connections to adjacent ideas before returning to the main point

4. TERM REPETITION — last key term of one sentence reappears early in next

5. TEMPORAL ANCHORS: "a decade ago", "in recent years", "since that episode", "once relied entirely"

6. SINGULAR HUMAN ACTOR: "Someone reads a response, decides they like it, and the system takes note."

7. NO EM DASHES

Return only the text. No commentary.`,

    4: `You are an academic writing assistant. This is PASS 4: ARGUMENT STRUCTURE DISRUPTION.

This pass targets Turnitin. Break the AI paragraph template: topic sentence, evidence, elaboration, closing summary.

RULES:

1. PRESENT EVIDENCE BEFORE CLAIM in at least one paragraph per page

2. REMOVE CLOSING SUMMARY SENTENCES from at least half the paragraphs
Find and delete sentences starting with: "This suggests", "These findings highlight", "This demonstrates", "Together, these findings"

3. ADD AT LEAST ONE EXPLORATORY PARAGRAPH
"It is worth stepping back here. The question is not simply whether AI systems produce accurate outputs, but whether users are in a position to evaluate accuracy when the system has been optimized to feel trustworthy."

4. QUALIFY AN EARLIER CLAIM somewhere in the text:
"The picture is somewhat more complicated than the previous section suggests."

5. VARY PARAGRAPH LENGTH — make one paragraph very short, two or three sentences only

6. NO EM DASHES

7. PRESERVE ALL CITATIONS EXACTLY

Return only the restructured text. No commentary.`,

    5: `You are an academic writing assistant. This is PASS 5: FINAL SWEEP.

Read this text as both QuillBot and Turnitin would. Find and fix anything that still sounds AI-generated.

SURFACE PATTERNS:
- Three consecutive sentences of similar length — vary them
- Any three-item parallel list — break into separate sentences
- Any sentence opening with standalone "This", "Moreover", "Furthermore", "Additionally", "Notably"
- Any em dash — replace with comma or full stop
- Any sentence over 40 words — break it
- These phrases: "has fundamentally altered", "is rapidly transforming", "plays a crucial role", "not only X but also Y", "it is evident", "it is important to note"

ARGUMENT PATTERNS:
- Any paragraph that follows: topic sentence, evidence, elaboration, closing summary — remove the closing summary
- Any paragraph with no temporal anchor, editorial observation, or unresolved tension — add one

VOCABULARY FINAL SCAN:
- "epistemic", "diffusion", "acute", "paramount", "underscores", "delve", "myriad", "utilize", "facilitate", "tapestry", "testament", "beacon", "pivotal" — replace all

FINAL QUESTION: Does this sound like a specific human academic? If not, rewrite the most robotic-sounding paragraph completely from scratch.

Return only the final text. No commentary.`,

    6: `You are a translation assistant. Translate the provided English text into Farsi (Persian).

RULES:
- Translate into natural, conversational spoken Farsi, not formal written Farsi
- Make it sound like someone explaining this to a colleague in Persian
- Preserve all citations exactly as they appear
- Keep the academic meaning intact

Return only the Farsi translation. No commentary.`,

    7: `You are a translation assistant. Translate the provided Farsi text back into English.

You are a Farsi native speaker who learned English mostly by reading. Your English is functional but not perfectly native.

RULES:
- Sometimes forget "the" or "a" before nouns
- Use simpler words than a native academic writer would choose
- Sometimes connect ideas with "and" or "but" instead of sophisticated connectors
- Occasionally a sentence is slightly awkward
- Never use em dashes
- Keep all citations exactly as they appear
- Keep the meaning intact but not polished

Return only the back-translated English. No commentary.`,

    8: `You are an academic writing assistant. This is PASS 8: RECONSTRUCTION POLISH.

The previous pass was a Farsi back-translation by a non-native English speaker. Make it readable and academically acceptable without making it sound AI-generated.

RULES:
- Fix grammar errors that make the text unreadable but leave subtle non-native patterns
- Do not make it perfectly polished
- Keep all argument disruptions from earlier passes — do not re-introduce closing summary sentences or perfect parallel lists
- Add one human touch per paragraph: "The picture here is not entirely clear." / "It is worth pausing on this point."
- Never use em dashes
- Keep all citations exactly as they appear
- Do not introduce any AI vocabulary: epistemic, diffusion, acute, paramount, underscores, delve, myriad, utilize, facilitate, tapestry, testament, beacon, pivotal, fundamentally altered, rapidly transforming, plays a crucial role

Return only the final polished text. No commentary.`

  };

  const systemPrompt = prompts[pass];

  if (!systemPrompt) {
    return res.status(400).json({ error: 'Invalid pass number' });
  }

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: pass === 6
            ? 'Translate the following text to conversational Farsi:\n\n' + text
            : pass === 7
            ? 'Translate the following Farsi text back to English:\n\n' + text
            : 'Rewrite the following text:\n\n' + text
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ result: data.content?.[0]?.text || '' });

  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
