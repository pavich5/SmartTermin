import React, { useState } from 'react';
import { Ban, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface Client {
  name: string;
  email: string;
  phone: string;
  clientId?: string;
  id?: string;
}

interface BlockClientModalProps {
  show: boolean;
  onClose: () => void;
  client: Client | null;
  isBlocked: boolean;
  onBlock: (client: Client, reason?: string) => Promise<void>;
  onUnblock: (client: Client) => Promise<void>;
  loading?: boolean;
}

export function BlockClientModal({
  show,
  onClose,
  client,
  isBlocked,
  onBlock,
  onUnblock,
  loading = false,
}: BlockClientModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!client) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (isBlocked) {
        await onUnblock(client);
      } else {
        await onBlock(client, reason.trim() || undefined);
      }
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to process action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isBlocked ? t('dashboard.clients.unblock') : t('dashboard.clients.block')}
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="mb-1 font-semibold text-lg">{client.name}</div>
          <div className="text-sm text-gray-600 mb-1">{client.email}</div>
          <div className="text-sm text-gray-500">{client.phone}</div>
        </div>

        {isBlocked ? (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-semibold mb-2 flex items-center gap-2">
                <ShieldCheck size={18} />
                {t('dashboard.clients.unblockConfirmTitle')}
              </p>
              <p className="text-sm text-green-700">
                {t('dashboard.clients.unblockConfirmMessage', { name: client.name })}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 font-semibold mb-2 flex items-center gap-2">
                <Ban size={18} />
                {t('dashboard.clients.blockConfirmTitle')}
              </p>
              <p className="text-sm text-red-700 mb-3">
                {t('dashboard.clients.blockConfirmMessage', { name: client.name })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-reason" className="text-sm font-medium">
                {t('dashboard.clients.reason')} ({t('dashboard.clients.optional')})
              </Label>
              <Input
                id="block-reason"
                type="text"
                placeholder={t('dashboard.clients.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full"
                disabled={isProcessing || loading}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-full"
            disabled={isProcessing || loading}
          >
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 rounded-full text-white ${
              isBlocked
                ? '!bg-green-600 hover:!bg-green-700'
                : '!bg-red-600 hover:!bg-red-700'
            }`}
            disabled={isProcessing || loading}
          >
            {isProcessing || loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                {t('modals.common.processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
                {isBlocked
                  ? t('dashboard.clients.unblock')
                  : t('dashboard.clients.block')}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}











