import { useTranslation } from 'react-i18next';
import { useUiStore } from '../ui/useUiStore';

interface FooterLinksProps {
  showBrand?: boolean;
}

export const FooterLinks = ({ showBrand = false }: FooterLinksProps) => {
  const { t } = useTranslation();
  const openInfo = useUiStore((state) => state.openInfo);

  return (
    <footer className="flex flex-col items-center justify-between border-t border-lush-gray-border bg-white px-8 py-6 text-xs text-gray-500 sm:flex-row">
      {showBrand && (
        <div className="mb-4 font-cabinet text-sm tracking-wide text-lush-black sm:mb-0">
          Lush Scent Guesser
        </div>
      )}
      <div className="mb-4 flex space-x-6 sm:mb-0">
        <button type="button" className="hover:underline" onClick={() => openInfo('terms')}>
          {t('footer.terms')}
        </button>
        <button type="button" className="hover:underline" onClick={() => openInfo('privacy')}>
          {t('footer.privacy')}
        </button>
        <button type="button" className="hover:underline" onClick={() => openInfo('contact')}>
          {t('footer.contact')}
        </button>
      </div>
      <div>&copy; 2026 Lush Scent Guesser. Stay Fresh.</div>
    </footer>
  );
};

export default FooterLinks;
