import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tent, Sprout, Image as ImageIcon, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

export default function Navigation() {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span>{t('nav.dashboard', 'Dashboard')}</span>
        </NavLink>
        <NavLink to="/environments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Tent size={24} />
          <span>{t('nav.environments', 'Environments')}</span>
        </NavLink>
        <NavLink to="/plants" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sprout size={24} />
          <span>{t('nav.plants', 'Plants')}</span>
        </NavLink>
        <NavLink to="/gallery" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ImageIcon size={24} />
          <span>{t('nav.gallery', 'Gallery')}</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={24} />
          <span>{t('nav.settings', 'Settings')}</span>
        </NavLink>
      </div>
    </nav>
  );
}
