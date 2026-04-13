'use client'

import { useState, useTransition } from 'react'
import { createUser, deleteUser } from '@/lib/actions'
import { Users, Plus, Trash2, Loader2, Shield, User as UserIcon, Lock } from 'lucide-react'

export function UserSettingsClient({ users }: { users: any[] }) {
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('manager')
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newUsername || !newPassword) return
    startTransition(async () => {
      await createUser(newUsername, newPassword, newRole)
      setNewUsername('')
      setNewPassword('')
      setNewRole('manager')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce compte de manière irréversible ?')) return
    startTransition(async () => {
      try {
        await deleteUser(id)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Users className="w-5 h-5 text-purple-400" />
        <h2 className="font-semibold text-white">Comptes Utilisateurs</h2>
        <span className="ml-auto text-xs text-zinc-600">{users.length} compte(s)</span>
      </div>

      {/* Formulaire création */}
      <form onSubmit={handleCreate} className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300">Ajouter un accès</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
             <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
             <input type="text" placeholder="Identifiant" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="input-field pl-10" />
          </div>
          <div className="relative">
             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
             <input type="text" placeholder="Mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="input-field pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field flex-1">
              <option value="manager">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
            <button type="submit" disabled={isPending || !newUsername || !newPassword} className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 text-white px-3 border border-purple-500 rounded-xl transition-colors flex items-center justify-center">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>

      {/* Liste des comptes */}
      <ul className="space-y-2">
        {users.map(u => (
          <li key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-800/40 border border-zinc-800/60 hover:bg-zinc-800/70 transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {u.role === 'admin' ? <Shield size={16} /> : <UserIcon size={16} />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{u.username}</p>
                <p className="text-xs text-zinc-500">Ajouté le {new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${u.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {u.role === 'admin' ? 'Administrateur' : 'Gestionnaire'}
              </span>
              <button onClick={() => handleDelete(u.id)} disabled={isPending} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
