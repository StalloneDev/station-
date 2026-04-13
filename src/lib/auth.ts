'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/session'

export async function login(formData: FormData) {
    const user = formData.get('username') as string
    const pass = formData.get('password') as string

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
    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000)
    const session = await encrypt({ user, role, expires })

    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' })
    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0), path: '/' })
}
