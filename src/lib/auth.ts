'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/session'

export async function login(formData: FormData) {
    const user = (formData.get('username') as string)?.trim()
    const pass = formData.get('password') as string
    const stationId = (formData.get('stationId') as string)?.trim() || null

    if (!user || !pass) {
        return { error: 'Identifiants obligatoires' }
    }

    const dbUser = await prisma.user.findUnique({
        where: { username: user }
    })

    if (!dbUser) {
        return { error: 'Identifiants incorrects' }
    }

    const isMatch = await bcrypt.compare(pass, dbUser.passwordHash)
    if (!isMatch) {
         return { error: 'Identifiants incorrects' }
    }

    const role = dbUser.role

    // If manager, a stationId is required
    if (role === 'manager' && !stationId) {
        return { error: 'Veuillez sélectionner votre station' }
    }

    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000)
    const session = await encrypt({ user, role, stationId, expires })

    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' })
    return { success: true, role }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0), path: '/' })
}
