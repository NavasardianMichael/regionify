import { type FC, useState } from 'react';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { processContactFormData, sendContactMessage } from '@/api/contact';

type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

const ContactPage: FC = () => {
  const [form] = Form.useForm<ContactFormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      const payload = processContactFormData(values);
      await sendContactMessage(payload);
      message.success('Message sent successfully! We will get in touch with you soon.');
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto! w-full max-w-112 shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary text-2xl font-bold">
          Contact Us
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Have a question? We are here to help.
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="name"
          label={<Typography.Text className="font-medium text-gray-700">Name</Typography.Text>}
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Enter your full name" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label={<Typography.Text className="font-medium text-gray-700">Email</Typography.Text>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="email@example.com" size="large" />
        </Form.Item>

        <Form.Item
          name="message"
          label={<Typography.Text className="font-medium text-gray-700">Message</Typography.Text>}
          rules={[{ required: true, message: 'Please enter your message' }]}
        >
          <Input.TextArea
            placeholder="How can we assist you?"
            rows={4}
            size="large"
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
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContactPage;
