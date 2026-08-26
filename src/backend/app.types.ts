import type { AuthService } from './modules/auth/auth.service.js'
import type { VehicleService } from './modules/vehicles/vehicle.service.js'
import type { UploadServiceContract } from './modules/upload/upload.service.js'

export type AppContext = {
  Variables: {
    authService: AuthService
    vehicleService: VehicleService
    uploadService: UploadServiceContract
  }
}