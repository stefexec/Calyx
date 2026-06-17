import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tent, Sprout, Image as ImageIcon, Settings } from 'lucide-react';
import './Navigation.css';

export default function Navigation() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/environments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Tent size={24} />
          <span>Environments</span>
        </NavLink>
        <NavLink to="/plants" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sprout size={24} />
          <span>Plants</span>
        </NavLink>
        <NavLink to="/gallery" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ImageIcon size={24} />
          <span>Gallery</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={24} />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
}
