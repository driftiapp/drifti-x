import { NextResponse } from 'next/server';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Send SMS with download link
    await twilioClient.messages.create({
      body: 'Download the DriftiX app: https://driftix.com/download',
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 