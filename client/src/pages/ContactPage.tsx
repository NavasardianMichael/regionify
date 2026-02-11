import { type FC, useState } from 'react';
import { App, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { sendContactMessage } from '@/api/contact';
import { processContactFormData } from '@/api/contact/processors';

type ContactFormValues = {
  firstName: string;
  lastName: string;
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
    <Card className="mx-auto! w-full max-w-144 shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary mb-sm! text-2xl">
          Contact Us
        </Typography.Title>
        <Typography.Paragraph className="mt-2 font-medium text-gray-500">
          Have a question? We are here to help.
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
          label={<Typography.Text className="font-medium">Message</Typography.Text>}
          rules={[{ required: true, message: 'Please enter your message' }]}
        >
          <Input.TextArea placeholder="How can we assist you?" rows={4} className="resize-none!" />
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
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContactPage;
