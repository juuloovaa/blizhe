import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Дом', icon: '✦' },
  { to: '/cards', label: 'Карты', icon: '♡' },
  { to: '/tests', label: 'Тесты', icon: '◎' },
  { to: '/assistant', label: 'Рядом', icon: '☺' },
  { to: '/profile', label: 'Я', icon: '❀' },
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
