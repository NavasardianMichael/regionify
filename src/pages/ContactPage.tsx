import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message } from 'antd';

type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

export const ContactPage: FC = () => {
  const [form] = Form.useForm<ContactFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      // TODO: Implement actual form submission
      console.log('Form submitted:', values);
      message.success('Message sent successfully!');
      form.resetFields();
    } catch {
      message.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-[448px] shadow-sm" styles={{ body: { padding: 24 } }}>
        <div className="mb-6 text-center">
          <h1 className="text-primary text-2xl font-bold">Contact Us</h1>
          <p className="mt-2 text-gray-500">Have a question We are here to help.</p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="font-medium text-gray-700">Name</span>}
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="font-medium text-gray-700">Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="email@example.com" size="large" />
          </Form.Item>

          <Form.Item
            name="message"
            label={<span className="font-medium text-gray-700">Message</span>}
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

      <Link
        to="/"
        className="text-primary hover:text-primary-400 mt-6 flex items-center gap-2 transition-colors"
      >
        <ArrowLeftOutlined />
        <span>Back to Home</span>
      </Link>
    </div>
  );
};
