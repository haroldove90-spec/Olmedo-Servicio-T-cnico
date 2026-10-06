import React from 'react';
import { UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

interface RoleOption {
  id: UserRole;
  name: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'cliente',
    name: 'Portal del Cliente (Empresas de Flotillas / Particulares)',
  },
  {
    id: 'jefe_taller',
    name: 'Jefe de Taller / Operaciones',
  },
  {
    id: 'tecnico',
    name: 'App / Portal del Técnico',
  },
  {
    id: 'gerencia',
    name: 'Gerencia Administrativa y Facturación',
  },
];

export const RoleSelector: React.FC = () => {
  const { setCurrentRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12">
      {/* Logotipo de tamaño completo sin encapsular */}
      <div className="mb-8 sm:mb-12 flex justify-center w-full max-w-4xl px-4">
        <img
          src="https://appdesignproyectos.com/olmedologo.png"
          alt="Olemdo Servicio Técnico"
          className="h-24 sm:h-28 md:h-36 w-auto object-contain max-w-full drop-shadow-xs"
        />
      </div>

      {/* Cuadrícula de Roles: 2 Columnas Móvil / 4 Columnas Escritorio. Sin header, sin descripciones, solo nombre del rol */}
      <div className="w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setCurrentRole(role.id)}
            className="group relative flex flex-col items-center justify-center text-center min-h-[140px] sm:min-h-[180px] p-5 sm:p-7 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-[#040057] shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-98 select-none"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#040057] mb-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-[#040057] group-hover:text-[#040057] transition-colors leading-snug">
              {role.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
