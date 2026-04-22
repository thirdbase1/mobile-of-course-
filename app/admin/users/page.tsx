'use client'

import { useState, useEffect } from 'react'
import { getUsers } from '@/lib/actions/admin'
import { UserTable } from '@/components/admin/user-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const result = await getUsers(page, 10)
      if (!result.error) {
        // Filter by search term
        let filtered = result.users
        if (searchTerm) {
          filtered = result.users.filter(
            (user) =>
              user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.phone_number?.includes(searchTerm)
          )
        }
        setUsers(filtered)
        setTotalPages(result.totalPages)
      }
      setLoading(false)
    }
    fetchUsers()
  }, [page, searchTerm])

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage users, credit/debit wallets, and assign roles</p>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">No users found</div>
      ) : (
        <>
          <UserTable users={users} />
          <div className="pagination">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
