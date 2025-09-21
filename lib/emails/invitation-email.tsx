import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface InvitationEmailProps {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  invitationUrl: string;
  userRole: 'admin' | 'member';
}

export const InvitationEmail = ({
  workspaceName,
  inviterName,
  inviterEmail,
  invitationUrl,
  userRole,
}: InvitationEmailProps) => {
  const previewText = `You've been invited to join ${workspaceName} on Isla`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="https://isla.app/logo.png"
                width="40"
                height="40"
                alt="Isla"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Join <strong>{workspaceName}</strong> on Isla
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterName || inviterEmail}</strong> has invited you to join the{' '}
              <strong>{workspaceName}</strong> workspace on Isla as {userRole === 'admin' ? 'an admin' : 'a member'}.
            </Text>
            {userRole === 'admin' && (
              <Text className="text-black text-[14px] leading-[24px]">
                As an admin, you'll be able to manage workspace settings, invite other members, and
                have full control over links and analytics.
              </Text>
            )}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={invitationUrl}
              >
                Accept Invitation
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link href={invitationUrl} className="text-blue-600 no-underline">
                {invitationUrl}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation will expire in 14 days. If you didn't expect this invitation, you
              can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InvitationEmail;