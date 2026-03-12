import { Center } from './center';

export type MachineType = 'cardio' | 'fuerza' | 'peso libre' | 'funcional' | 'otro';
export type MachineStatus = 'operativa' | 'en mantenimiento' | 'fuera de servicio';

// Instancia de una máquina en un centro específico
/** Instance of a machine in a specific center */
export interface MachineCenterInstance {
  id: string;
  machineTypeId: string;
  /** Instance number (e.g., Treadmill 1, Treadmill 2) */
  instanceNumber: number;
  centerId: string;
  status: MachineStatus;
  machineType?: {
    id: string;
    name: string;
    type: MachineType;
  };
  center?: {
    id: string;
    name: string;
    city?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Tipo de máquina (ej: "Cinta de correr", "Prensa de piernas")
/** Machine type definition (e.g., "Treadmill", "Leg Press") */
export interface MachineTypeModel {
  id: string;
  name: string;
  type: MachineType;
  createdAt?: string;
  updatedAt?: string;
  /** Instances of this machine in different centers */
  instances?: MachineCenterInstance[];
}

// Para compatibilidad con el código existente, mantenemos Machine como alias
export interface Machine extends MachineTypeModel {
  // Para mostrar en listados, puede incluir información del centro si hay instancias
  instances?: MachineCenterInstance[];
}

export interface CreateMachineTypeInput {
  name: string;
  type: MachineType;
}

export interface UpdateMachineTypeInput {
  name?: string;
  type?: MachineType;
}

export interface AddMachineToCenterInput {
  centerId: string;
  quantity: number;
  status?: MachineStatus; // Opcional, por defecto será "operativa"
  maxUsers?: number;
}

export interface UpdateMachineInCenterInput {
  status?: MachineStatus;
}
