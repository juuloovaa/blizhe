import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Главная', icon: '⌂' },
  { to: '/cards', label: 'Карточки', icon: '◇' },
  { to: '/tests', label: 'Тесты', icon: '◎' },
  { to: '/assistant', label: 'Помощник', icon: '✦' },
  { to: '/profile', label: 'Профиль', icon: '○' },
];

export function BottomNav() {
  return (
    <nav className="nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
