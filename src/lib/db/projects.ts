import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Project CRUD Operations
export async function createProject(data: {
  name: string
  orderId?: number
  status?: string
}) {
  return await prisma.project.create({
    data: {
      name: data.name,
      orderId: data.orderId,
      status: data.status as any || 'draft'
    }
  })
}

export async function getProjectById(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      crewDetails: true,
      transport: true
    }
  })
}

export async function getProjectByOrderId(orderId: number) {
  return await prisma.project.findUnique({
    where: { orderId },
    include: {
      crewDetails: true,
      transport: true
    }
  })
}

export async function getAllProjects() {
  return await prisma.project.findMany({
    include: {
      crewDetails: true,
      transport: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateProject(id: string, data: {
  name?: string
  status?: string
}) {
  return await prisma.project.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.status && { status: data.status as any })
    }
  })
}

export async function deleteProject(id: string) {
  return await prisma.project.delete({
    where: { id }
  })
}

// Crew Detail CRUD Operations
export async function addCrewDetail(data: {
  projectId: string
  workType: string
  numberOfCrew: number
  shiftsNeeded: number
  fare: number
  accommodation?: string
}) {
  return await prisma.crewDetail.create({
    data: {
      projectId: data.projectId,
      workType: data.workType as any,
      numberOfCrew: data.numberOfCrew,
      shiftsNeeded: data.shiftsNeeded,
      fare: data.fare,
      accommodation: data.accommodation
    }
  })
}

export async function getCrewDetailsByProjectId(projectId: string) {
  return await prisma.crewDetail.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function updateCrewDetail(id: string, data: {
  workType?: string
  numberOfCrew?: number
  shiftsNeeded?: number
  fare?: number
  accommodation?: string
}) {
  return await prisma.crewDetail.update({
    where: { id },
    data: {
      workType: data.workType as any,
      numberOfCrew: data.numberOfCrew,
      shiftsNeeded: data.shiftsNeeded,
      fare: data.fare,
      accommodation: data.accommodation
    }
  })
}

export async function deleteCrewDetail(id: string) {
  return await prisma.crewDetail.delete({
    where: { id }
  })
}

// Transport CRUD Operations
export async function addTransport(data: {
  projectId: string
  vehicleType: string
  numberOfTrips: number
  pricePerTrip: number
  contingency?: number
}) {
  return await prisma.transport.create({
    data: {
      projectId: data.projectId,
      vehicleType: data.vehicleType,
      numberOfTrips: data.numberOfTrips,
      pricePerTrip: data.pricePerTrip,
      contingency: data.contingency || 0
    }
  })
}

export async function getTransportByProjectId(projectId: string) {
  return await prisma.transport.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function updateTransport(id: string, data: {
  vehicleType?: string
  numberOfTrips?: number
  pricePerTrip?: number
  contingency?: number
}) {
  return await prisma.transport.update({
    where: { id },
    data
  })
}

export async function deleteTransport(id: string) {
  return await prisma.transport.delete({
    where: { id }
  })
}
