import type { AuthService } from './modules/auth/auth.service'
import type { VehicleService } from './modules/vehicles/vehicle.service'
import type { UploadService } from './modules/upload/upload.service'

export type AppContext = {
  Variables: {
    authService: AuthService
    vehicleService: VehicleService
    uploadService: UploadService
  }
}