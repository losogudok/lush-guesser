import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type InfoModalType = 'help' | 'terms' | 'privacy' | 'contact';

interface InfoModalProps {
  type: InfoModalType | null;
  onClose: () => void;
}

const modalBodyKeys: Record<InfoModalType, string[]> = {
  help: [
    'info.help.p1',
    'info.help.p2',
    'info.help.p3',
    'info.help.p4',
    'info.help.p5',
  ],
  terms: ['info.terms.p1', 'info.terms.p2', 'info.terms.p3'],
  privacy: ['info.privacy.p1', 'info.privacy.p2', 'info.privacy.p3'],
  contact: ['info.contact.p1'],
};

export const InfoModal = ({ type, onClose }: InfoModalProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!type) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, type]);

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="info-modal-title"
        className="w-full max-w-lg border-2 border-lush-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="info-modal-title"
            className="font-cabinet text-3xl uppercase leading-tight text-lush-black"
          >
            {t(`info.${type}.title`)}
          </h2>
          <button
            type="button"
            className="shrink-0 text-lush-black transition-opacity hover:opacity-70"
            onClick={onClose}
            title={t('info.close')}
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-gray-600">
          {modalBodyKeys[type].map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
          {type === 'contact' && (
            <div className="flex flex-col gap-2 pt-1">
              <a
                className="text-lush-black underline hover:opacity-70"
                href="https://t.me/andrey_the_developer"
                target="_blank"
                rel="noreferrer"
              >
                {t('info.contact.telegram')}: @andrey_the_developer
              </a>
              <a
                className="text-lush-black underline hover:opacity-70"
                href="https://github.com/losogudok"
                target="_blank"
                rel="noreferrer"
              >
                {t('info.contact.github')}: github.com/losogudok
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InfoModal;
