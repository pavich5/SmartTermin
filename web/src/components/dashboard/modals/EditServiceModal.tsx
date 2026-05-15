import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface EditServiceModalProps {
  show: boolean;
  onClose: () => void;
  service: Service | null;
  onSave: (service: { name: string; duration: string; price: string; description: string }) => void;
  isLoading?: boolean;
}

export function EditServiceModal({ show, onClose, service, onSave, isLoading = false }: EditServiceModalProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState(service?.name || '');
  const [duration, setDuration] = React.useState(service?.duration.toString() || '');
  const [price, setPrice] = React.useState(service?.price.toString() || '');
  const [description, setDescription] = React.useState(service?.description || '');

  React.useEffect(() => {
    if (service) {
      setName(service.name);
      setDuration(service.duration.toString());
      setPrice(service.price.toString());
      setDescription(service.description);
    }
  }, [service]);

  const handleSave = () => {
    onSave({ name, duration, price, description });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title={t('modals.editService.title')}>
      <div className="space-y-4">
        <div>
          <Label>{t('modals.addService.serviceName')}</Label>
          <Input
            type="text"
            className="mt-2 h-12 rounded-xl"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('modals.addService.duration')}</Label>
          <Input
            type="number"
            className="mt-2 h-12 rounded-xl"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('modals.addService.price')}</Label>
          <Input
            type="number"
            className="mt-2 h-12 rounded-xl"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('modals.addService.description')}</Label>
          <textarea
            className="w-full mt-2 p-4 rounded-xl border border-gray-200 resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? t('modals.common.saving') || 'Saving...' : t('modals.common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
