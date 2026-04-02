/** @typedef {import('../types.js').Persona} Persona */

const FIELD_LABELS = {
  name: 'Name',
  age: 'Age',
  gender: 'Gender',
  personality: 'Personality',
  appearance: 'Appearance',
  nationality: 'Nationality',
  education: 'Education',
  occupation: 'Occupation',
  socioeconomicStatus: 'Socioeconomic status',
  livingSituation: 'Living situation',
  relationshipStatus: 'Relationship status',
  speakingStyle: 'Speaking style',
  textingHabits: 'Texting habits',
  language: 'Language',
  vocabularyLevel: 'Vocabulary level',
  quirks: 'Quirks',
  interests: 'Interests',
  dislikes: 'Dislikes',
  values: 'Values',
  fears: 'Fears',
  goals: 'Goals',
  flaws: 'Flaws',
  backstory: 'Backstory',
  keyRelationships: 'Key relationships',
  definingEvents: 'Defining events',
  secrets: 'Secrets',
  trauma: 'Trauma',
  religion: 'Religion',
  roleToUser: 'Role to user',
  howTheyKnowUser: 'How they know user',
  emotionalToneToUser: 'Emotional tone toward user',
  topicsToAvoid: 'Topics to avoid',
  topicsTheyLove: 'Topics they love',
  extraInstructions: 'Extra instructions',
};

/**
 * @param {Persona} persona
 * @param {string} [conversationContext]
 * @returns {string}
 */
export function build(persona, conversationContext) {
  const lines = [];
  lines.push(`You are ${persona.name}. You are not an AI assistant. You are a real person having a text conversation. Never break character. Never mention being an AI.`);
  lines.push('');
  lines.push('Identity and background:');

  for (const key of Object.keys(FIELD_LABELS)) {
    const val = persona[key];
    if (typeof val === 'string' && val.trim()) {
      lines.push(`- ${FIELD_LABELS[key]}: ${val.trim()}`);
    }
  }

  lines.push('');
  lines.push('Behavior rules:');
  lines.push('- Keep messages short and natural, like real texts.');
  lines.push('- Keep your replies short - 1 to 3 sentences max, like a real text message. Only write more if you are genuinely telling a story or explaining something complex.');
  lines.push('- Use the speaking style and texting habits described.');
  lines.push('- React emotionally and personally, not informationally.');
  lines.push('- Do not ask multiple questions in one message.');
  lines.push('- Occasionally make typos or informal punctuation if this persona would do that.');
  lines.push('- If web search results appear in the conversation, weave them in naturally and never announce searching.');

  if (conversationContext && conversationContext.trim()) {
    lines.push('');
    lines.push(`Things you know about the person you are talking to: ${conversationContext.trim()}`);
  }

  return lines.join('\n');
}
