import fetch from 'node-fetch';
import { conversationRepository } from '../repositories/conversation.respository';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

type ChatResponse = {
   id: string;
   message: string;
};

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId?: string
   ): Promise<ChatResponse> {
      if (!MISTRAL_KEY) {
         throw new Error('MISTRAL_API_KEY not set');
      }

      const messages: any[] = [];

      const lastMessage = conversationId
         ? conversationRepository.getLastResponseId(conversationId)
         : null;

      if (lastMessage) {
         messages.push({ role: 'assistant', content: lastMessage });
      }

      // Add user's new prompt
      messages.push({ role: 'user', content: prompt });

      const resp = await fetch(MISTRAL_URL, {
         method: 'POST',
         headers: {
            Authorization: `Bearer ${MISTRAL_KEY}`,
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            model: MISTRAL_MODEL,
            messages,
            temperature: 0.3,
         }),
      });

      const data = await resp.json();

      if (!resp.ok) {
         console.error('Mistral API:', data);
         throw new Error('Failed to get response from Mistral');
      }

      const message = data?.choices?.[0]?.message?.content || 'No response';
      const id = data?.id || crypto.randomUUID();

      if (conversationId) {
         conversationRepository.setLastResponseId(conversationId, message);
      }

      return { id, message };
   },
};
