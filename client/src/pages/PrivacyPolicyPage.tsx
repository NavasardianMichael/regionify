import { type FC } from 'react';
import { Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';
import { LegalSection } from '@/components/shared/LegalSection';
import { AppNavLink } from '@/components/ui/AppNavLink';

const PrivacyPolicyPage: FC = () => (
  <LegalPageLayout title="Privacy Policy" lastUpdated="May 18, 2025">
    <Typography.Paragraph className="mb-0! text-gray-600">
      Regionify (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting
      your privacy. This Privacy Policy explains what information we collect, how we use it, and
      your rights regarding that information.
    </Typography.Paragraph>

    <LegalSection heading="1. Information We Collect">
      <Typography.Paragraph className="mb-0! text-gray-600">
        <strong>Account information:</strong> When you register, we collect your name, email
        address, and — if you sign in with Google — your profile avatar URL and Google account
        identifier.
      </Typography.Paragraph>
      <Typography.Paragraph className="mb-0! text-gray-600">
        <strong>Project data:</strong> When you save a project, we store the processed dataset, map
        styling choices, and associated metadata you provide (title, description, keywords).
      </Typography.Paragraph>
      <Typography.Paragraph className="mb-0! text-gray-600">
        <strong>Session data:</strong> We maintain a session cookie named{' '}
        <code className="rounded bg-gray-100 px-1 font-mono text-sm">regionify.sid</code> to keep
        you logged in. Sessions are stored in Redis and expire after 7 days of inactivity.
      </Typography.Paragraph>
      <Typography.Paragraph className="mb-0! text-gray-600">
        <strong>Usage analytics:</strong> We use Google Analytics 4 to collect anonymized usage data
        (page views, feature interactions). This data does not include personal information from
        your projects. Analytics are not loaded on public map embed pages.
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="2. How We Use Your Information">
      <ul className="list-disc pl-6 text-gray-600">
        <li>To authenticate you and provide access to your account.</li>
        <li>To store and retrieve your saved projects.</li>
        <li>To send transactional emails (email verification, password reset).</li>
        <li>To improve the Service based on aggregated usage patterns.</li>
        <li>To process payments through our payment processor, Paddle.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="3. Third-Party Processors">
      <Typography.Paragraph className="mb-0! text-gray-600">
        We share information with trusted third-party processors only to the extent necessary to
        provide the Service:
      </Typography.Paragraph>
      <ul className="list-disc pl-6 text-gray-600">
        <li>
          <strong>Paddle</strong> — payment processing. Paddle collects and stores payment card data
          directly; Regionify does not store card details.
        </li>
        <li>
          <strong>Google</strong> — OAuth 2.0 authentication (if you choose &ldquo;Sign in with
          Google&rdquo;) and Google Analytics 4 for anonymized usage analytics.
        </li>
        <li>
          <strong>Email service provider</strong> — sending transactional emails such as email
          verification and password reset messages.
        </li>
      </ul>
    </LegalSection>

    <LegalSection heading="4. Cookies">
      <Typography.Paragraph className="mb-0! text-gray-600">
        We use two categories of cookies:
      </Typography.Paragraph>
      <ul className="list-disc pl-6 text-gray-600">
        <li>
          <strong>Strictly necessary:</strong>{' '}
          <code className="rounded bg-gray-100 px-1 font-mono text-sm">regionify.sid</code> — a
          session cookie required to keep you logged in. Without it, the Service cannot function.
        </li>
        <li>
          <strong>Analytics:</strong> Google Analytics 4 cookies (prefixed{' '}
          <code className="rounded bg-gray-100 px-1 font-mono text-sm">_ga</code>) — used to
          understand aggregate usage patterns. These are not loaded on public embed pages.
        </li>
      </ul>
    </LegalSection>

    <LegalSection heading="5. Data Retention">
      <Typography.Paragraph className="mb-0! text-gray-600">
        Account and project data is retained while your account is active. Session data expires
        automatically after 7 days of inactivity. If you delete your account, all associated data is
        permanently removed from our systems within 30 days.
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="6. Your Rights">
      <Typography.Paragraph className="mb-0! text-gray-600">
        You have the right to access, correct, or delete your personal data. You can update your
        profile information and delete your account directly in your account settings. For any other
        requests — including data export or restriction of processing — please{' '}
        <AppNavLink to={ROUTES.CONTACT} className="font-semibold! underline!">
          contact us
        </AppNavLink>
        .
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="7. Security">
      <Typography.Paragraph className="mb-0! text-gray-600">
        All data is transmitted over HTTPS. Passwords are hashed using Argon2id before storage.
        Sessions are stored in Redis with a 7-day sliding expiry. We apply rate limiting to
        authentication endpoints to mitigate brute-force attacks.
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="8. Children">
      <Typography.Paragraph className="mb-0! text-gray-600">
        The Service is not directed at children under 13 years of age. We do not knowingly collect
        personal information from children under 13. If you believe a child has provided us with
        personal information, please contact us so we can delete it.
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="9. Changes to This Policy">
      <Typography.Paragraph className="mb-0! text-gray-600">
        We may update this Privacy Policy from time to time. We will post the revised version at
        this URL with a new &ldquo;Last updated&rdquo; date. Your continued use of the Service after
        any change constitutes acceptance of the updated policy.
      </Typography.Paragraph>
    </LegalSection>

    <LegalSection heading="10. Contact">
      <Typography.Paragraph className="mb-0! text-gray-600">
        If you have questions about this Privacy Policy or want to exercise your data rights, please{' '}
        <AppNavLink to={ROUTES.CONTACT} className="font-semibold! underline!">
          contact us
        </AppNavLink>
        .
      </Typography.Paragraph>
    </LegalSection>
  </LegalPageLayout>
);

export default PrivacyPolicyPage;
