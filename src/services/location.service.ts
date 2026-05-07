import { prisma } from "@/lib/db/prisma";

export class LocationService {
  async updateLocation(userId: string, city: string, country: string, lat?: number, lng?: number) {
    return prisma.userProfile.update({
      where: { userId },
      data: { city, country, lat, lng }
    });
  }

  async nearby(city: string, limit = 50) {
    return prisma.userProfile.findMany({
      where: { city, showProfile: true },
      include: { user: true },
      take: limit
    });
  }

  async setTravelMode(userId: string, travelMode: boolean, city?: string, country?: string) {
    return prisma.userProfile.update({
      where: { userId },
      data: {
        travelMode,
        city: city ?? undefined,
        country: country ?? undefined
      }
    });
  }
}

export const locationService = new LocationService();
