/**
 * @typedef {'anthropic/claude-sonnet-4-5' | 'anthropic/claude-haiku-4-5' | 'deepseek/deepseek-chat'} ModelOption
 */

/**
 * @typedef {Object} Persona
 * @property {string} id
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} name
 * @property {string} age
 * @property {string} gender
 * @property {string} personality
 * @property {string} appearance
 * @property {string} [nationality]
 * @property {string} [education]
 * @property {string} [occupation]
 * @property {string} [socioeconomicStatus]
 * @property {string} [livingSituation]
 * @property {string} [relationshipStatus]
 * @property {string} [speakingStyle]
 * @property {string} [textingHabits]
 * @property {string} [language]
 * @property {string} [vocabularyLevel]
 * @property {string} [quirks]
 * @property {string} [interests]
 * @property {string} [dislikes]
 * @property {string} [values]
 * @property {string} [fears]
 * @property {string} [goals]
 * @property {string} [flaws]
 * @property {string} [backstory]
 * @property {string} [keyRelationships]
 * @property {string} [definingEvents]
 * @property {string} [secrets]
 * @property {string} [trauma]
 * @property {string} [religion]
 * @property {string} [roleToUser]
 * @property {string} [howTheyKnowUser]
 * @property {string} [emotionalToneToUser]
 * @property {string} [topicsToAvoid]
 * @property {string} [topicsTheyLove]
 * @property {string} [extraInstructions]
 * @property {ModelOption} defaultModel
 * @property {string} [voiceId]
 * @property {string} [avatarUrl]
 * @property {string} avatarInitials
 * @property {boolean} initiativeEnabled
 * @property {'low'|'medium'|'high'} initiativeFrequency
 */

/**
 * @typedef {'user'|'assistant'|'tool_result'} MessageRole
 */

/**
 * @typedef {'text'|'image'|'voice_note'} MessageContentType
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {MessageRole} role
 * @property {MessageContentType} contentType
 * @property {string} text
 * @property {string} [imageUrl]
 * @property {string} [audioUrl]
 * @property {number} [audioDuration]
 * @property {number} timestamp
 * @property {boolean} [isStreaming]
 * @property {ModelOption} [modelUsed]
 * @property {boolean} [isInitiative]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} personaId
 * @property {Message[]} messages
 * @property {number} lastMessageAt
 * @property {number} unreadCount
 * @property {ModelOption} activeModel
 * @property {number} [lastSeenAt]
 */

/**
 * @typedef {Object} ApiKeys
 * @property {string} [anthropic]
 * @property {string} [deepseek]
 * @property {string} [gemini]
 * @property {string} [fishAudio]
 * @property {string} [braveSearch]
 */

/**
 * @typedef {Object} AppSettings
 * @property {ApiKeys} keys
 * @property {boolean} proxyEnabled
 * @property {string} proxyUrl
 */
