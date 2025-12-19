import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Email service not configured. Please contact admin.' },
        { status: 500 }
      );
    }

    console.log('Attempting to send email from:', email);

    // Send email (Resend free tier only allows sending to your verified email)
    // To send to multiple addresses, verify your domain at resend.com/domains
    const { data, error } = await resend.emails.send({
      from: 'ChemStock <onboarding@resend.dev>',
      to: ['aadityahande27@gmail.com'],
      replyTo: email,
      subject: `Support Request: ${subject}`,
      html: `
        <h2>New Support Request from ChemStock</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Reply directly to this email to respond to ${email}</p>
        <p style="color: #666; font-size: 12px;"><strong>Note:</strong> Please forward to adityasuryawanshi038@gmail.com</p>
      `,
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message || 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('Primary email sent successfully:', data);

    // If an alternate API key is provided, attempt to send with that key as well
    const altResults: any = { attempted: false };
    if (process.env.RESEND_API_KEY_ALT) {
      try {
        altResults.attempted = true;
        const resendAlt = new Resend(process.env.RESEND_API_KEY_ALT);
        // Alt send - target partner's verified address (if configured)
        const altResp = await resendAlt.emails.send({
          from: 'ChemStock <onboarding@resend.dev>',
          to: ['adityasuryawanshi038@gmail.com'],
          replyTo: email,
          subject: `Support Request: ${subject}`,
          html: `
            <h2>New Support Request from ChemStock</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br />')}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">Reply directly to this email to respond to ${email}</p>
          `,
        });
        altResults.success = true;
        altResults.data = altResp;
        console.log('Alt email sent successfully:', altResp);
      } catch (altErr: any) {
        altResults.success = false;
        altResults.error = altErr?.message || String(altErr);
        console.error('Alt Resend error:', altErr);
      }
    }

    return NextResponse.json({ success: true, primary: data, alt: altResults }, { status: 200 });
  } catch (error: any) {
    console.error('Support email error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
