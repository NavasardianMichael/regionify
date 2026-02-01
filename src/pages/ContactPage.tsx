import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { App, Button, Card, Flex, Form, Input, Typography } from 'antd';
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
      message.success('Message sent successfully!');
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      className="min-h-[calc(100vh-140px)] w-full bg-gray-50 px-4 py-8"
    >
      <Card className="w-full max-w-112 shadow-sm" styles={{ body: { padding: 24 } }}>
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
            <Input.TextArea placeholder="How can we assist you?" rows={4} size="large" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Link to="/" className="text-primary hover:text-primary-400 mt-6 transition-colors">
        <Flex align="center" gap="small">
          <ArrowLeftOutlined />
          <Typography.Text>Back to Home</Typography.Text>
        </Flex>
      </Link>
    </Flex>
  );
};

export default ContactPage;
