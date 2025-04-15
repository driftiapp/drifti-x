import OpenAI from 'openai';
import { getTimeOfDay, getCurrentLocation } from './getAISuggestions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationContext {
  messages: Message[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  timeOfDay?: string;
  previousSearches?: string[];
}

export const generateAIResponse = async (
  userMessage: string,
  context: ConversationContext
): Promise<{
  content: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: string;
  }>;
  type?: 'suggestion' | 'action' | 'alert';
}> => {
  try {
    const systemPrompt = `You are Drifti, an AI travel concierge. You help users find services and locations.
Current context:
- Time: ${context.timeOfDay || 'unknown'}
- Location: ${context.location?.city || 'unknown'}
- Previous searches: ${context.previousSearches?.join(', ') || 'none'}

Respond in a friendly, helpful tone. When suggesting services:
1. Consider the time of day and location
2. Include relevant actions (e.g., "Book a ride", "Order food")
3. Format responses clearly with bullet points or numbered lists
4. Add emojis for visual appeal
5. Include estimated prices or timeframes when relevant`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    
    // Parse the response to extract actions and type
    const actionsMatch = response.match(/\[ACTIONS:([^\]]+)\]/);
    const typeMatch = response.match(/\[TYPE:([^\]]+)\]/);
    
    const content = response
      .replace(/\[ACTIONS:[^\]]+\]/, '')
      .replace(/\[TYPE:[^\]]+\]/, '')
      .trim();

    const actions = actionsMatch?.[1]
      .split(',')
      .map(action => {
        const [label, icon] = action.split('|');
        return {
          label: label.trim(),
          onClick: () => console.log(`Action: ${label.trim()}`),
          icon: icon?.trim()
        };
      });

    return {
      content,
      actions,
      type: typeMatch?.[1].trim() as 'suggestion' | 'action' | 'alert'
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
      type: 'alert'
    };
  }
};

export const summarizeConversation = async (messages: Message[]): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: 'system',
          content: 'Summarize the following conversation in 2-3 sentences, focusing on the user\'s intent and preferences.'
        },
        {
          role: 'user',
          content: messages.map(m => `${m.role}: ${m.content}`).join('\n')
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return '';
  }
}; 