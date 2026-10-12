import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  ShieldCheck, 
  UserCheck,
  Wrench,
  UserPlus,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Technician, EmployeeRole } from '../../types';

export const EmployeesManager: React.FC = () => {
  const { 
    technicians, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    orders 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | EmployeeRole>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Technician | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('tecnico');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');
  const [status, setStatus] = useState<'disponible' | 'en_campo' | 'en_taller' | 'ocupado'>('disponible');

  const openNewModal = () => {
    setEditingEmployee(null);
    setName('');
    setRole('tecnico');
    setSpecialty('');
    setPhone('');
    setEmail('');
    setZone('Taller Central Olmedo');
    setStatus('disponible');
    setShowModal(true);
  };

  const openEditModal = (emp: Technician) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setRole(emp.role || 'tecnico');
    setSpecialty(emp.specialty);
    setPhone(emp.phone);
    setEmail(emp.email || '');
    setZone(emp.zone);
    setStatus(emp.status);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: name.trim(),
        role,
        specialty: specialty.trim() || 'Servicio General',
        phone: phone.trim(),
        email: email.trim(),
        zone: zone.trim() || 'Taller Central Olmedo',
        status,
      });
    } else {
      addEmployee({
        name: name.trim(),
        role,
        specialty: specialty.trim() || 'Servicio Técnico',
        phone: phone.trim(),
        email: email.trim(),
        zone: zone.trim() || 'Taller Central Olmedo',
        status,
      });
    }

    setShowModal(false);
  };

  const filteredEmployees = technicians.filter(emp => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      emp.name.toLowerCase().includes(term) ||
      emp.specialty.toLowerCase().includes(term) ||
      emp.phone.toLowerCase().includes(term) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      emp.zone.toLowerCase().includes(term);

    const matchesRole = roleFilter === 'todos' || (emp.role || 'tecnico') === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleName?: EmployeeRole) => {
    switch (roleName) {
      case 'jefe_taller':
        return { label: 'Jefe de Taller', bg: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'admin':
        return { label: 'Administrador', bg: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'gerencia':
        return { label: 'Gerencia / Dirección', bg: 'bg-indigo-100 text-[#040057] border-indigo-200' };
      case 'tecnico':
      default:
        return { label: 'Técnico Especialista', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0">
      
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#040057]">
                Gestión de Personal y Empleados
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registro y administración de Técnicos, Jefes de Taller, Administradores y Personal Operativo
            </p>
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-xl transition cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Registrar Empleado</span>
          </button>
        </div>

        {/* Resumen de Personal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100 mt-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Personal</span>
            <span className="text-lg font-extrabold text-[#040057]">{technicians.length}</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 text-[10px] uppercase font-bold block">Técnicos de Taller</span>
            <span className="text-lg font-extrabold text-emerald-900">
              {technicians.filter(t => !t.role || t.role === 'tecnico').length}
            </span>
          </div>
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
            <span className="text-blue-700 text-[10px] uppercase font-bold block">Jefes de Taller</span>
            <span className="text-lg font-extrabold text-blue-900">
              {technicians.filter(t => t.role === 'jefe_taller').length}
            </span>
          </div>
          <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
            <span className="text-indigo-700 text-[10px] uppercase font-bold block">Admin y Gerencia</span>
            <span className="text-lg font-extrabold text-[#040057]">
              {technicians.filter(t => t.role === 'admin' || t.role === 'gerencia').length}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, especialidad, teléfono, correo o zona..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#040057] bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
          >
            <option value="todos">Todos los Roles</option>
            <option value="tecnico">Técnicos</option>
            <option value="jefe_taller">Jefes de Taller</option>
            <option value="admin">Administradores</option>
            <option value="gerencia">Gerencia</option>
          </select>
        </div>
      </div>

      {/* Listado de Empleados en Tarjetas Modernas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const badge = getRoleBadge(emp.role);
          const activeOrder = orders.find(o => o.id === emp.currentOrderId || (o.assignedTechnicianId === emp.id && (o.status === 'asignado' || o.status === 'en_diagnostico_trabajo')));

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-[#040057] text-base shadow-2xs">
                      {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#040057] text-sm leading-snug">{emp.name}</h3>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    emp.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' :
                    emp.status === 'en_campo' ? 'bg-blue-100 text-[#040057]' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {emp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{emp.specialty}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${emp.phone}`} className="hover:text-blue-600 font-semibold">{emp.phone}</a>
                  </div>

                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${emp.email}`} className="hover:text-blue-600 truncate">{emp.email}</a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.zone}</span>
                  </div>
                </div>

                {activeOrder && (
                  <div className="mt-3 p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs">
                    <span className="font-bold text-[#040057] block text-[11px]">Orden Asignada Activa:</span>
                    <span className="font-semibold text-slate-800">{activeOrder.folio} • {activeOrder.vehicle.plates}</span>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => openEditModal(emp)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Confirmas que deseas eliminar a ${emp.name}?`)) {
                      deleteEmployee(emp.id);
                    }
                  }}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                  title="Eliminar empleado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Crear / Editar Empleado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#040057] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm sm:text-base">
                {editingEmployee ? 'Editar Datos del Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza Torres"
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-[#040057]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol en la Empresa *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                  >
                    <option value="tecnico">Técnico Operativo</option>
                    <option value="jefe_taller">Jefe de Taller</option>
                    <option value="admin">Administrador</option>
                    <option value="gerencia">Gerencia / Dirección</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estatus Actual *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_taller">En Taller</option>
                    <option value="en_campo">En Campo / Rescate</option>
                    <option value="ocupado">Ocupado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Especialidad / Puesto *</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej. Motores Diésel Cummins, Frenos de Aire y Neumática"
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 55 4123 9081"
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@olmedo.com"
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zona / Bahía Asignada</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej. Taller Central Bahía 2 / Unidad Móvil 03"
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
