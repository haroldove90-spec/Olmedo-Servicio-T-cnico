import React from 'react';
import { 
  Building2, 
  ClipboardCheck, 
  PenTool, 
  Users 
} from 'lucide-react';
import { UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

interface RoleOption {
  id: UserRole;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  hoverBorder: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'gerencia',
    name: 'Gerencia',
    icon: Building2,
    iconColor: 'text-[#040057]',
    bgColor: 'bg-indigo-50/80 group-hover:bg-indigo-100',
    hoverBorder: 'hover:border-[#040057]',
  },
  {
    id: 'jefe_taller',
    name: 'Jefe de taller',
    icon: ClipboardCheck,
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-50/80 group-hover:bg-blue-100',
    hoverBorder: 'hover:border-blue-600',
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    icon: PenTool,
    iconColor: 'text-amber-700',
    bgColor: 'bg-amber-50/80 group-hover:bg-amber-100',
    hoverBorder: 'hover:border-amber-600',
  },
  {
    id: 'cliente',
    name: 'Portal clientes',
    icon: Users,
    iconColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50/80 group-hover:bg-emerald-100',
    hoverBorder: 'hover:border-emerald-600',
  },
];

export const RoleSelector: React.FC = () => {
  const { setCurrentRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12">
      {/* Logotipo y Nombre del negocio sin subtítulos */}
      <div className="mb-8 sm:mb-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 gap-3">
        <img
          src="https://appdesignproyectos.com/olmedologo.png"
          alt="Servicio Técnico Olmedo"
          className="h-24 sm:h-28 md:h-36 w-auto object-contain max-w-full drop-shadow-xs"
        />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#040057] uppercase tracking-tight text-center">
          Servicio Técnico Olmedo
        </h1>
      </div>

      {/* Cuadrícula de Roles: Orden solicitado: 1. Gerencia, 2. Jefe de taller, 3. Técnico, 4. Portal clientes */}
      <div className="w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => setCurrentRole(role.id)}
              className={`group relative flex flex-col items-center justify-center text-center min-h-[160px] sm:min-h-[190px] p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200/90 ${role.hoverBorder} shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-98 select-none`}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${role.bgColor} flex items-center justify-center mb-3.5 transition-colors shadow-2xs`}>
                <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${role.iconColor} transition-transform group-hover:scale-110 duration-200`} />
              </div>
              
              <span className="text-base sm:text-lg md:text-xl font-bold text-[#040057] transition-colors leading-snug">
                {role.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
