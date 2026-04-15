import { type FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Flex, Form, Input, Typography } from 'antd';
import { sendContactMessage } from '@/api/contact';
import { processAccountDeletionFeedback } from '@/api/contact/processors';
import { selectLogout } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { Card } from '@/components/ui/Card';

type FeedbackFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

type AccountState = {
  name: string;
  email: string;
} | null;

const AccountDeletedPage: FC = () => {
  const { t } = useTypedTranslation();
  const location = useLocation();
  const accountState = location.state as AccountState;

  const nameParts = (accountState?.name ?? '').trim().split(/\s+/);
  const initialFirstName = nameParts[0] ?? '';
  const initialLastName = nameParts.slice(1).join(' ');

  const logout = useProfileStore(selectLogout);

  useEffect(() => {
    logout();
  }, [logout]);

  const [form] = Form.useForm<FeedbackFormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = useAppFeedback();

  const handleSubmit = async (values: FeedbackFormValues) => {
    setLoading(true);
    try {
      const payload = processAccountDeletionFeedback(values, accountState ?? undefined);
      await sendContactMessage(payload);
      message.success(t('messages.feedbackThankYou'), 5);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send feedback';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-auto! w-full max-w-144 shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary mb-sm! text-2xl">
          We&apos;re Sorry to See You Go
        </Typography.Title>
        <Typography.Paragraph className="mt-2 font-medium text-gray-500">
          Your account has been deleted. We&apos;d love to hear your feedback to help us improve.
        </Typography.Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        initialValues={{
          firstName: initialFirstName,
          lastName: initialLastName,
          email: accountState?.email ?? '',
        }}
      >
        <Flex gap="middle">
          <Form.Item
            name="firstName"
            label={<Typography.Text className="font-medium">First Name</Typography.Text>}
            rules={[{ required: true, message: 'Please enter your first name' }]}
            className="flex-1"
          >
            <Input placeholder="First name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={<Typography.Text className="font-medium">Last Name</Typography.Text>}
            rules={[{ required: true, message: 'Please enter your last name' }]}
            className="flex-1"
          >
            <Input placeholder="Last name" />
          </Form.Item>
        </Flex>

        <Form.Item
          name="email"
          label={<Typography.Text className="font-medium">Email</Typography.Text>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item
          name="message"
          label={<Typography.Text className="font-medium">Feedback</Typography.Text>}
          rules={[{ required: true, message: 'Please share your feedback' }]}
        >
          <Input.TextArea
            placeholder="What could we have done better?"
            rows={4}
            className="resize-none!"
          />
        </Form.Item>

        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <Form.Item className="mt-8! mb-0!">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Submit Feedback
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AccountDeletedPage;
