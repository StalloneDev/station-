import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Upsert products
    const essence = await prisma.product.upsert({
      where: { name: 'Essence' },
      update: {},
      create: { name: 'Essence' },
    })
    const gasoil = await prisma.product.upsert({
      where: { name: 'Gasoil' },
      update: {},
      create: { name: 'Gasoil' },
    })

    // Upsert stations from Excel data
    const stationNames = [
      'FIDJROSSE/JENN SERVICE',
      'STATION ABOMEY-CALAVI',
      'STATION PORTO-NOVO',
      'STATION COTONOU CENTRE',
    ]
    for (const name of stationNames) {
      await prisma.station.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    }

    return NextResponse.json({ success: true, message: 'Données initialisées avec succès.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
