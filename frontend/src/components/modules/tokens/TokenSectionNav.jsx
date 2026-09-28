import React from 'react';
import { NavLink } from 'react-router-dom';
import { Ticket, Monitor } from 'lucide-react';

export default function TokenSectionNav() {
  const cls = ({ isActive }) =>
    `inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold transition-colors ${
      isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-white'
    }`;

  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-100" data-testid="token-section-nav">
      <NavLink
        to="/tokens"
        end
        className={cls}
        style={({ isActive }) => ({ backgroundColor: isActive ? '#ff6d00' : undefined })}
        data-testid="token-tab-booking"
      >
        <Ticket className="h-4 w-4" />
        1. Booking
      </NavLink>
      <NavLink
        to="/tokens/counter"
        className={cls}
        style={({ isActive }) => ({ backgroundColor: isActive ? '#0747a3' : undefined })}
        data-testid="token-tab-screen"
      >
        <Monitor className="h-4 w-4" />
        2. Screen
      </NavLink>
    </div>
  );
}
