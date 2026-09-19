import { useTranslation } from 'react-i18next';
import type { InfoModalType } from './InfoModal';

interface FooterLinksProps {
  onOpenInfo: (type: InfoModalType) => void;
  showBrand?: boolean;
}

export const FooterLinks = ({ onOpenInfo, showBrand = false }: FooterLinksProps) => {
  const { t } = useTranslation();

  return (
    <footer className="flex flex-col items-center justify-between border-t border-lush-gray-border bg-white px-8 py-6 text-xs text-gray-500 sm:flex-row">
      {showBrand && (
        <div className="mb-4 font-cabinet text-sm tracking-wide text-lush-black sm:mb-0">
          Lush Scent Guesser
        </div>
      )}
      <div className="mb-4 flex space-x-6 sm:mb-0">
        <button type="button" className="hover:underline" onClick={() => onOpenInfo('terms')}>
          {t('footer.terms')}
        </button>
        <button type="button" className="hover:underline" onClick={() => onOpenInfo('privacy')}>
          {t('footer.privacy')}
        </button>
        <button type="button" className="hover:underline" onClick={() => onOpenInfo('contact')}>
          {t('footer.contact')}
        </button>
      </div>
      <div>&copy; 2026 Lush Scent Guesser. Stay Fresh.</div>
    </footer>
  );
};

export default FooterLinks;
