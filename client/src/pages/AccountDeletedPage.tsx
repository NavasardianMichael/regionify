import { type FC, useState } from 'react';
import { App, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { sendContactMessage } from '@/api/contact';
import { processAccountDeletionFeedback } from '@/api/contact/processors';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type FeedbackFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

const AccountDeletedPage: FC = () => {
  const { t } = useTypedTranslation();
  const [form] = Form.useForm<FeedbackFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: FeedbackFormValues) => {
    setLoading(true);
    try {
      const payload = processAccountDeletionFeedback(values);
      await sendContactMessage(payload);
      setSubmitted(true);
      message.success(t('messages.feedbackThankYou'), 5);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send feedback';
      message.error(errorMessage, 0);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mx-auto! w-full max-w-144 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary mb-0! text-xl font-bold">
            Thank You
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            We appreciate your feedback. Your account has been successfully deleted.
          </Typography.Paragraph>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto! w-full max-w-144 shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary mb-sm! text-2xl">
          We&apos;re Sorry to See You Go
        </Typography.Title>
        <Typography.Paragraph className="mt-2 font-medium text-gray-500">
          Your account has been deleted. We&apos;d love to hear your feedback to help us improve.
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
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
            placeholder="What could we have done better? (Optional)"
            rows={4}
            className="resize-none!"
          />
        </Form.Item>

        <input
          type="text"
          name="website"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Submit Feedback
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AccountDeletedPage;
