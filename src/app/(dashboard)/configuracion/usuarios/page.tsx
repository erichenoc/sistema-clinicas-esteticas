import { getUsers, getUserStats } from '@/actions/user-management'
import { UsersClient } from './_components/users-client'

export default async function UsuariosPage() {
  const [users, stats] = await Promise.all([
    getUsers(),
    getUserStats(),
  ])

  return <UsersClient initialUsers={users} initialStats={stats} />
}
