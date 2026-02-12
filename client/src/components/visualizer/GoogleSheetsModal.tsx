import { type ChangeEvent, type FC, useCallback, useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Typography } from 'antd';
import { fetchGoogleSheet } from '@/api/sheets';

type Props = {
  open: boolean;
  onClose: () => void;
  onCsvFetched: (csv: string) => void;
};

const GOOGLE_SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/;

const GoogleSheetsModal: FC<Props> = ({ open, onClose, onCsvFetched }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = GOOGLE_SHEETS_URL_REGEX.test(url.trim());

  const handleFetch = useCallback(async () => {
    if (!isValidUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const csv = await fetchGoogleSheet({ url: url.trim() });
      onCsvFetched(csv);
      setUrl('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Google Sheet');
    } finally {
      setIsLoading(false);
    }
  }, [url, isValidUrl, onCsvFetched, onClose]);

  const handleCancel = useCallback(() => {
    setUrl('');
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-4!">
          <LinkOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            Import from Google Sheets
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnHidden
    >
      <Flex vertical gap="middle" className="py-2">
        <Typography.Text className="text-sm text-gray-600">
          Paste the URL of a <strong>public</strong> Google Sheet. The sheet must be shared as
          &quot;Anyone with the link&quot;.
        </Typography.Text>

        <Input
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onPressEnter={handleFetch}
          status={error ? 'error' : undefined}
          allowClear
        />

        {error && (
          <Typography.Text type="danger" className="text-xs">
            {error}
          </Typography.Text>
        )}

        <Flex vertical gap={4} className="rounded-md bg-gray-50 p-3">
          <Typography.Text className="text-xs font-medium text-gray-500">
            HOW TO SHARE:
          </Typography.Text>
          <ol className="m-0 space-y-1 pl-4 text-xs text-gray-500">
            <li>Open your Google Sheet</li>
            <li>
              Click <strong>Share</strong> → <strong>General access</strong>
            </li>
            <li>
              Change to <strong>&quot;Anyone with the link&quot;</strong>
            </li>
            <li>Copy the URL and paste it above</li>
          </ol>
        </Flex>

        <Button
          type="primary"
          icon={<LinkOutlined />}
          onClick={handleFetch}
          loading={isLoading}
          disabled={!isValidUrl}
          block
        >
          {isLoading ? 'Fetching...' : 'Import Sheet'}
        </Button>
      </Flex>
    </Modal>
  );
};

export default GoogleSheetsModal;
