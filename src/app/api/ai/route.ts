import { NextResponse } from 'next/server';
import { generateAIResponse, summarizeConversation } from '@/utils/aiService';

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    const response = await generateAIResponse(message, context);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in AI API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
} 