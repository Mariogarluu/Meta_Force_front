import { Center } from './center';

export type MachineType = 'cardio' | 'fuerza' | 'peso libre' | 'funcional' | 'otro';
export type MachineStatus = 'operativa' | 'en mantenimiento' | 'fuera de servicio';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  centerId: string;
  center?: Center; // Para mostrar el nombre del centro en listados globales
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMachineInput {
  name: string;
  type: MachineType;
  status: MachineStatus;
  centerId: string;
}

export interface UpdateMachineInput {
  name?: string;
  type?: MachineType;
  status?: MachineStatus;
  centerId?: string;
}