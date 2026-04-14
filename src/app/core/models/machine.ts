import { Center } from './center';

/** Categorization of fitness equipment types */
export type MachineType = 'cardio' | 'fuerza' | 'peso libre' | 'funcional' | 'otro';
/** Current physical and operational condition of a machine instance */
export type MachineStatus = 'operativa' | 'en mantenimiento' | 'fuera de servicio';

// Instancia de una máquina en un centro específico
/** Instance of a machine in a specific center */
/** Instance of a machine in a specific center */
export interface MachineCenterInstance {
  /** Unique identifier for the instance */
  id: string;
  /** ID of the machine type it belongs to */
  machineTypeId: string;
  /** Instance number (e.g., Treadmill 1, Treadmill 2) */
  instanceNumber: number;
  /** ID of the center where it's located */
  centerId: string;
  /** Current operational status of the machine instance */
  status: MachineStatus;
  /** Basic machine type information */
  machineType?: {
    id: string;
    name: string;
    type: MachineType;
  };
  /** Basic center information */
  center?: {
    id: string;
    name: string;
    city?: string;
  };
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
  updatedAt?: string;
}

/** Machine type definition (e.g., "Treadmill", "Leg Press") */
export interface MachineTypeModel {
  /** Unique identifier for the machine type */
  id: string;
  /** Display name of the machine */
  name: string;
  /** Category of the machine */
  type: MachineType;
  /** ISO date string of creation */
  createdAt?: string;
  /** ISO date string of last update */
  updatedAt?: string;
  /** Instances of this machine in different centers */
  instances?: MachineCenterInstance[];
}

/** 
 * Interface for Machine for backwards compatibility.
 */
export interface Machine extends MachineTypeModel {
  /** Instances of this machine in different centers */
  instances?: MachineCenterInstance[];
}

/**
 * Data needed to create a new machine type.
 */
export interface CreateMachineTypeInput {
  /** Name of the new machine type */
  name: string;
  /** Category of the machine */
  type: MachineType;
}

/**
 * Data needed to update an existing machine type.
 */
export interface UpdateMachineTypeInput {
  /** Updated name */
  name?: string;
  /** Updated category */
  type?: MachineType;
}

/**
 * Data needed to add physical machines to a center.
 */
export interface AddMachineToCenterInput {
  /** Target center ID */
  centerId: string;
  /** Number of machine instances to add */
  quantity: number;
  /** Initial status for the instances */
  status?: MachineStatus;
  /** Maximum number of users that can use it at once */
  maxUsers?: number;
}

/**
 * Data needed to update a specific machine instance in a center.
 */
export interface UpdateMachineInCenterInput {
  /** New status for the instance */
  status?: MachineStatus;
}

