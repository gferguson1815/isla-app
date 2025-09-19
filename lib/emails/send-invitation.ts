import { Resend } from 'resend';
import { InvitationEmail } from './invitation-email';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendInvitationEmailParams {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  invitationToken: string;
  userRole: 'admin' | 'member';
}

export async function sendInvitationEmail({
  to,
  workspaceName,
  inviterName,
  inviterEmail,
  invitationToken,
  userRole,
}: SendInvitationEmailParams) {
  if (!resend) {
    console.log('Email service not configured - skipping invitation email');
    return null;
  }

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Isla <invitations@isla.app>',
      to: [to],
      subject: `You've been invited to join ${workspaceName} on Isla`,
      react: InvitationEmail({
        workspaceName,
        inviterName,
        inviterEmail,
        invitationUrl,
        userRole,
      }),
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}