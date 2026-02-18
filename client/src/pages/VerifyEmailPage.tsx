import { type FC, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Spin, Typography } from 'antd';
import { verifyEmail } from '@/api/auth';
import { ROUTES } from '@/constants/routes';
import { AppNavLink } from '@/components/ui/AppNavLink';

type VerifyState = 'loading' | 'success' | 'error';

const VerifyEmailPage: FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    verifyEmail({ token })
      .then(() => {
        if (!cancelled) setState('success');
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState('error');
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to verify email. Please try again.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <Card className="mx-auto! w-full max-w-144! shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            Verification Failed
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            Invalid verification link. No token provided.
          </Typography.Paragraph>
          <AppNavLink to={ROUTES.SIGN_UP}>
            <Button type="primary" className="mt-4">
              Back to Sign Up
            </Button>
          </AppNavLink>
        </div>
      </Card>
    );
  }

  if (state === 'loading') {
    return (
      <Card className="mx-auto! w-full max-w-144! shadow-sm">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Spin size="large" />
          <Typography.Text className="text-gray-500">Verifying your email...</Typography.Text>
        </div>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card className="mx-auto! w-full max-w-144! shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            Verification Failed
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">{errorMessage}</Typography.Paragraph>
          <Typography.Paragraph className="mt-4 text-sm text-gray-600">
            You can resend a verification email from the login page.
          </Typography.Paragraph>
          <div className="mt-4 flex flex-col gap-2">
            <AppNavLink to={ROUTES.LOGIN}>
              <Button type="primary" block>
                Go to Login
              </Button>
            </AppNavLink>
            <AppNavLink to={ROUTES.SIGN_UP}>
              <Button block>Back to Sign Up</Button>
            </AppNavLink>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Typography.Title level={2} className="text-primary text-xl font-bold">
          Email Verified
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Your email has been verified successfully. You can now log in with your credentials.
        </Typography.Paragraph>
        <AppNavLink to={ROUTES.LOGIN}>
          <Button type="primary" className="mt-4">
            Go to Login
          </Button>
        </AppNavLink>
      </div>
    </Card>
  );
};

export default VerifyEmailPage;
