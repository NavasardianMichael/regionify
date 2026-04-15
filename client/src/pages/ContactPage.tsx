import { type FC, useState } from 'react';
import { Button, Flex, Form, Input, Typography } from 'antd';
import { sendContactMessage } from '@/api/contact';
import { processContactFormData } from '@/api/contact/processors';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { Card } from '@/components/ui/Card';

type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

const ContactPage: FC = () => {
  const [form] = Form.useForm<ContactFormValues>();
  const [loading, setLoading] = useState(false);
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();

  const handleSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      const payload = processContactFormData(values);
      await sendContactMessage(payload);
      message.success(t('contact.success'), 5);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('contact.error');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-auto! w-full max-w-144 shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title
          level={1}
          className="text-primary mb-sm! text-2xl"
          data-i18n-key="contact.title"
        >
          {t('contact.title')}
        </Typography.Title>
        <Typography.Paragraph
          className="mt-2 font-medium text-gray-500"
          data-i18n-key="contact.subtitle"
        >
          {t('contact.subtitle')}
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Flex gap="middle">
          <Form.Item
            name="firstName"
            label={
              <Typography.Text className="font-medium" data-i18n-key="contact.firstName">
                {t('contact.firstName')}
              </Typography.Text>
            }
            rules={[{ required: true, message: t('contact.firstNameRequired') }]}
            className="flex-1"
            data-i18n-key="contact.firstNameRequired"
          >
            <Input placeholder={t('contact.firstName')} data-i18n-key="contact.firstName" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={
              <Typography.Text className="font-medium" data-i18n-key="contact.lastName">
                {t('contact.lastName')}
              </Typography.Text>
            }
            rules={[{ required: true, message: t('contact.lastNameRequired') }]}
            className="flex-1"
            data-i18n-key="contact.lastNameRequired"
          >
            <Input placeholder={t('contact.lastName')} data-i18n-key="contact.lastName" />
          </Form.Item>
        </Flex>

        <Form.Item
          name="email"
          label={
            <Typography.Text className="font-medium" data-i18n-key="contact.email">
              {t('contact.email')}
            </Typography.Text>
          }
          rules={[
            { required: true, message: t('contact.emailRequired') },
            { type: 'email', message: t('contact.emailRequired') },
          ]}
          data-i18n-key="contact.emailRequired"
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item
          name="message"
          label={
            <Typography.Text className="font-medium" data-i18n-key="contact.message">
              {t('contact.message')}
            </Typography.Text>
          }
          rules={[{ required: true, message: t('contact.messageRequired') }]}
          data-i18n-key="contact.messageRequired"
        >
          <Input.TextArea
            placeholder={t('contact.message')}
            rows={4}
            className="resize-none!"
            data-i18n-key="contact.message"
          />
        </Form.Item>

        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <Form.Item className="mt-8! mb-0!">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            data-i18n-key="contact.submit"
          >
            {t('contact.submit')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContactPage;
