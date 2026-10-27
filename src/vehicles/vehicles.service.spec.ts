import { describe, expect, it } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { VehiclesService } from './vehicles.service.js';

function build(vehicle: any, plateTaken = false) {
  const repo: any = {
    findOneBy: async () => vehicle,
    existsBy: async () => plateTaken,
    create: (data: object) => ({ ...data }),
    save: async (data: object) => data,
  };
  return new VehiclesService(repo);
}

describe('VehiclesService', () => {
  const dto = { plate: 'abc123', brand: 'Chevrolet', model: 'NPR', year: 2022, mileage: 100 };

  it('normalizes the plate to upper case on create', async () => {
    expect(await build(null).create(dto)).toMatchObject({ plate: 'ABC123' });
  });

  it('rejects a duplicated plate with 409', async () => {
    await expect(build(null, true).create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 404 when the vehicle does not exist', async () => {
    await expect(build(null).findOne(9)).rejects.toBeInstanceOf(NotFoundException);
    await expect(build(null).findByPlate('zzz')).rejects.toThrow('ZZZ');
  });

  it('cannot deactivate a vehicle that is IN_MAINTENANCE', async () => {
    const service = build({ plate: 'ABC123', status: VehicleStatus.IN_MAINTENANCE });
    await expect(service.deactivate(1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates (logical delete) an available vehicle and reactivates it', async () => {
    const vehicle = { plate: 'ABC123', status: VehicleStatus.AVAILABLE };
    const service = build(vehicle);
    expect((await service.deactivate(1)).status).toBe(VehicleStatus.INACTIVE);
    expect((await service.activate(1)).status).toBe(VehicleStatus.AVAILABLE);
  });

  it('cannot activate a vehicle that is not INACTIVE', async () => {
    await expect(build({ plate: 'ABC123', status: VehicleStatus.AVAILABLE }).activate(1)).rejects.toThrow(/ya está activo/);
  });
});
