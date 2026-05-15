import React from 'react';
import { X, Image, ImageIcon, User, Save } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { toast } from 'sonner';

interface AddPortfolioModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (data: { file: File; setAsBanner: boolean; setAsProfile: boolean }) => void;
  isLoading?: boolean;
}

export function AddPortfolioModal({ show, onClose, onSave, isLoading = false }: AddPortfolioModalProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [setAsBanner, setSetAsBanner] = React.useState(false);
  const [setAsProfile, setSetAsProfile] = React.useState(false);

  React.useEffect(() => {
    if (!show) {
      setSelectedFile(null);
      setPreview(null);
      setSetAsBanner(false);
      setSetAsProfile(false);
    }
  }, [show]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('modals.addPortfolio.fileTooLarge'), {
          description: t('modals.addPortfolio.fileTooLargeDesc'),
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!selectedFile) {
      toast.error(t('modals.addPortfolio.selectImage'), {
        description: t('modals.addPortfolio.selectImageDesc'),
      });
      return;
    }
    onSave({ file: selectedFile, setAsBanner, setAsProfile });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title={t('modals.addPortfolio.title')}>
      <div className="space-y-4">
        <div>
          <Label>{t('modals.addPortfolio.uploadImage')}</Label>
          <div
            className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative"
            onClick={() => document.getElementById('portfolio-image-upload')?.click()}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt={t('portfolio.previewAlt')}
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Image size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">{t('modals.addPortfolio.clickToUpload')}</p>
                <p className="text-sm text-gray-500">{t('modals.addPortfolio.fileFormats')}</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="portfolio-image-upload"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {preview && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <Label className="text-base font-semibold">{t('modals.addPortfolio.setAs')}</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={setAsBanner}
                  onChange={(e) => {
                    setSetAsBanner(e.target.checked);
                    if (e.target.checked && setAsProfile) {
                      setSetAsProfile(false);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-blue-600" />
                  <span className="text-gray-700">{t('modals.addPortfolio.setAsBanner')}</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-sky-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={setAsProfile}
                  onChange={(e) => {
                    setSetAsProfile(e.target.checked);
                    if (e.target.checked && setAsBanner) {
                      setSetAsBanner(false);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2">
                  <User size={18} className="text-sky-600" />
                  <span className="text-gray-700">{t('modals.addPortfolio.setAsProfile')}</span>
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('modals.addPortfolio.note')}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFile || isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('modals.addPortfolio.uploading') || 'Uploading...'}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {t('modals.addPortfolio.uploadButton')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
