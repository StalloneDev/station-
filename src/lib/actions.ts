'use server'

import prisma from './prisma'
import { revalidatePath, unstable_cache } from 'next/cache'
import bcrypt from 'bcryptjs'

// ─── STATIONS ──────────────────────────────────────────────────────────────

export async function getStations() {
  return prisma.station.findMany({ orderBy: { name: 'asc' } })
}

export async function createStation(name: string) {
  const station = await prisma.station.create({ data: { name } })
  revalidatePath('/parametres')
  return station
}

export async function deleteStation(id: string) {
  await prisma.station.delete({ where: { id } })
  revalidatePath('/parametres')
}

// ─── PRODUCTS ──────────────────────────────────────────────────────────────

export async function getProducts() {
  return prisma.product.findMany({ orderBy: { name: 'asc' } })
}

// ─── USERS ─────────────────────────────────────────────────────────────────

export async function getUsers() {
  return prisma.user.findMany({ 
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' } 
  })
}

export async function createUser(username: string, passwordRaw: string, role: string) {
  const passwordHash = await bcrypt.hash(passwordRaw, 10)
  const user = await prisma.user.create({ data: { username, passwordHash, role } })
  revalidatePath('/parametres')
  return user
}

export async function deleteUser(id: string) {
  // Prevent deleting the very first admin to avoid lockout
  const countAdmins = await prisma.user.count({ where: { role: 'admin' } })
  const user = await prisma.user.findUnique({ where: { id } })
  
  if (user?.role === 'admin' && countAdmins <= 1) {
    throw new Error('Impossible de supprimer le dernier administrateur.')
  }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/parametres')
}

// ─── DAILY STATES ──────────────────────────────────────────────────────────

export async function getDailyStatesForDate(date: string, stationId?: string) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prisma.dailyState.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(stationId ? { stationId } : {}),
    },
    include: { station: true, product: true },
    orderBy: [{ station: { name: 'asc' } }, { date: 'asc' }, { product: { name: 'asc' } }],
  })
}

export async function getDailyStatesRange(startDate: string, endDate: string, stationId?: string) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return prisma.dailyState.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(stationId ? { stationId } : {}),
    },
    include: { station: true, product: true },
    orderBy: [{ station: { name: 'asc' } }, { date: 'asc' }, { product: { name: 'asc' } }],
  })
}

export async function getDailyStateById(id: string) {
  return prisma.dailyState.findUnique({
    where: { id },
    include: { station: true, product: true },
  })
}

export async function getPreviousDayJauge(stationId: string, productId: string, date: string) {
  const prevDate = new Date(date)
  prevDate.setDate(prevDate.getDate() - 1)
  prevDate.setHours(0, 0, 0, 0)
  const prevEnd = new Date(date)
  prevEnd.setDate(prevEnd.getDate() - 1)
  prevEnd.setHours(23, 59, 59, 999)

  const prevState = await prisma.dailyState.findFirst({
    where: {
      stationId,
      productId,
      date: { gte: prevDate, lte: prevEnd },
      etatValidation: 'valide',
    },
  })
  return prevState?.jaugeDuJour ?? null
}

export async function saveDailyState(data: {
  date: string
  stationId: string
  productId: string
  stockOuverture: number
  volumeVendu: number
  reception: number
  jaugeDuJour: number
  observation: string
}) {
  const stockTheoriqueFermeture = data.stockOuverture + data.reception - data.volumeVendu
  const ecart = data.jaugeDuJour - stockTheoriqueFermeture
  const tauxEcart = stockTheoriqueFermeture > 0 ? (ecart / stockTheoriqueFermeture) * 100 : 0
  const flagAnomalie = Math.abs(tauxEcart) > 0.5

  const stateDate = new Date(data.date)
  stateDate.setHours(12, 0, 0, 0)

  await prisma.dailyState.upsert({
    where: {
      date_stationId_productId: {
        date: stateDate,
        stationId: data.stationId,
        productId: data.productId,
      },
    },
    update: {
      stockOuverture: data.stockOuverture,
      volumeVendu: data.volumeVendu,
      reception: data.reception,
      stockTheoriqueFermeture,
      jaugeDuJour: data.jaugeDuJour,
      ecart,
      tauxEcart,
      observation: data.observation,
      flagAnomalie,
      etatValidation: 'valide',
    },
    create: {
      date: stateDate,
      stationId: data.stationId,
      productId: data.productId,
      stockOuverture: data.stockOuverture,
      volumeVendu: data.volumeVendu,
      reception: data.reception,
      stockTheoriqueFermeture,
      jaugeDuJour: data.jaugeDuJour,
      ecart,
      tauxEcart,
      observation: data.observation,
      flagAnomalie,
      etatValidation: 'valide',
    },
  })

  revalidatePath('/')
  revalidatePath('/etats')
  revalidatePath('/saisie')
  revalidatePath('/stock')
}

export async function getLatestStocks() {
  const stations = await prisma.station.findMany({
    orderBy: { name: 'asc' },
  })

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  })

  // For each station and product, find the most recent validated entry
  const data = await Promise.all(stations.map(async (station) => {
    const productsData = await Promise.all(products.map(async (product) => {
      const latest = await prisma.dailyState.findFirst({
        where: {
          stationId: station.id,
          productId: product.id,
          etatValidation: 'valide'
        },
        orderBy: { date: 'desc' },
        include: { product: true }
      })

      return {
        product: product.name,
        latestDate: latest?.date ?? null,
        stockOuverture: latest?.stockOuverture ?? 0,
        stockCalculé: latest?.stockTheoriqueFermeture ?? 0,
        jaugeDernière: latest?.jaugeDuJour ?? null,
        status: latest ? (new Date().getTime() - new Date(latest.date).getTime() < 86400000 * 2 ? 'à jour' : 'en retard') : 'aucune donnée'
      }
    }))

    return {
      stationName: station.name,
      stationId: station.id,
      products: productsData
    }
  }))

  return data
}

// ─── DASHBOARD ANALYTICS ───────────────────────────────────────────────────

export async function getDashboardStats(dateStr?: string) {
  const fetchStats = unstable_cache(
    async (cacheDateStr?: string) => {
      let targetDate: Date

      if (cacheDateStr) {
        targetDate = new Date(cacheDateStr)
    targetDate.setHours(0, 0, 0, 0)
  } else {
    targetDate = new Date()
    targetDate.setHours(0, 0, 0, 0)
  }

  const targetEnd = new Date(targetDate)
  targetEnd.setHours(23, 59, 59, 999)

  const countToday = await prisma.dailyState.count({
    where: { date: { gte: targetDate, lte: targetEnd } }
  })

  if (countToday === 0) {
    const mostRecent = await prisma.dailyState.findFirst({
      orderBy: { date: 'desc' },
    })
    if (mostRecent) {
      targetDate = new Date(mostRecent.date)
      targetDate.setHours(0, 0, 0, 0)
    }
  }

  const todayEnd = new Date(targetDate)
  todayEnd.setHours(23, 59, 59, 999)

  const thirtyDaysAgo = new Date(targetDate)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const [todayStates, recentStates, allStations] = await Promise.all([
    prisma.dailyState.findMany({
      where: { date: { gte: targetDate, lte: todayEnd } },
      select: {
        stationId: true,
        volumeVendu: true,
        flagAnomalie: true,
        station: { select: { name: true } }
      },
    }),
    prisma.dailyState.findMany({
      where: { date: { gte: thirtyDaysAgo, lte: todayEnd } },
      select: { date: true, volumeVendu: true },
      orderBy: { date: 'asc' },
    }),
    prisma.station.findMany({ orderBy: { name: 'asc' } }),
  ])

  const totalVentesToday = todayStates.reduce((s: number, r: any) => s + r.volumeVendu, 0)
  const totalAnomalies = todayStates.filter((r: any) => r.flagAnomalie).length
  const stationsWithData = new Set(todayStates.map((r: any) => r.stationId)).size

  const byDate: Record<string, number> = {}
  recentStates.forEach((r: any) => {
    const d = r.date.toISOString().split('T')[0]
    byDate[d] = (byDate[d] ?? 0) + r.volumeVendu
  })
  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }))

  const stationMap: Record<string, { name: string; ventes: number; anomalies: number }> = {}
  todayStates.forEach((r: any) => {
    if (!stationMap[r.stationId]) {
      stationMap[r.stationId] = { name: r.station.name, ventes: 0, anomalies: 0 }
    }
    stationMap[r.stationId].ventes += r.volumeVendu
    if (r.flagAnomalie) stationMap[r.stationId].anomalies++
  })

  return {
    displayDate: targetDate.toISOString().split('T')[0],
    totalVentesToday,
    totalAnomalies,
    stationsWithData,
    totalStations: allStations.length,
    chartData,
    stationSummary: Object.values(stationMap).sort((a: any, b: any) => b.ventes - a.ventes),
  }
  }, ['dashboard-stats', dateStr || 'today'], { revalidate: 3600, tags: ['daily-states'] })

  return fetchStats(dateStr)
}

export async function getStatesForExport(startDate: string, endDate: string, stationId?: string) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return prisma.dailyState.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(stationId ? { stationId } : {}),
    },
    include: { station: true, product: true },
    orderBy: [{ station: { name: 'asc' } }, { date: 'asc' }, { product: { name: 'asc' } }],
  })
}

// ─── ANALYSE ───────────────────────────────────────────────────────────────

export async function getAnalyseData(stationId?: string) {
  const fetchAnalyse = unstable_cache(
    async (sId?: string) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
      thirtyDaysAgo.setHours(0, 0, 0, 0)

      const filter: any = {
        date: { gte: thirtyDaysAgo },
        ...(sId ? { stationId: sId } : {}),
      }

  const [states, allStations] = await Promise.all([
    prisma.dailyState.findMany({
      where: filter,
      select: {
        id: true,
        date: true,
        volumeVendu: true,
        flagAnomalie: true,
        ecart: true,
        tauxEcart: true,
        observation: true,
        stationId: true,
        station: { select: { name: true } },
        product: { select: { name: true } }
      },
      orderBy: { date: 'asc' },
    }),
    prisma.station.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Tendances: group by date, sum by product
  const trendByDate: Record<string, { essence: number; gasoil: number }> = {}
  states.forEach((r: any) => {
    const d = r.date.toISOString().split('T')[0]
    if (!trendByDate[d]) trendByDate[d] = { essence: 0, gasoil: 0 }
    if (r.product.name.trim() === 'Essence') trendByDate[d].essence += r.volumeVendu
    else trendByDate[d].gasoil += r.volumeVendu
  })
  const trendData = Object.entries(trendByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v, total: v.essence + v.gasoil }))

  // Performance par station
  const stationPerf: Record<string, { name: string; essence: number; gasoil: number; anomalies: number; jours: number }> = {}
  states.forEach((r: any) => {
    const sid = r.stationId
    if (!stationPerf[sid]) stationPerf[sid] = { name: r.station.name, essence: 0, gasoil: 0, anomalies: 0, jours: 0 }
    if (r.product.name.trim() === 'Essence') stationPerf[sid].essence += r.volumeVendu
    else stationPerf[sid].gasoil += r.volumeVendu
    if (r.flagAnomalie) stationPerf[sid].anomalies++
  })
  const stationPerformance = Object.values(stationPerf)
    .map((s: any) => ({ ...s, total: s.essence + s.gasoil }))
    .sort((a: any, b: any) => b.total - a.total)

  // Anomalies
  const anomalies = states
    .filter((r: any) => r.flagAnomalie)
    .sort((a: any, b: any) => Math.abs(b.ecart ?? 0) - Math.abs(a.ecart ?? 0))
    .map((r: any) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      station: r.station.name,
      product: r.product.name,
      ecart: r.ecart,
      tauxEcart: r.tauxEcart,
      observation: r.observation,
    }))

    return { trendData, stationPerformance, anomalies, totalStations: allStations.length }
  }, ['analyse-data', stationId || 'all'], { revalidate: 3600, tags: ['daily-states'] })

  return fetchAnalyse(stationId)
}
