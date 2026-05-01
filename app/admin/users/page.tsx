'use client'

import { useState, useEffect } from 'react'
import { getUsers } from '@/lib/actions/admin'
import { UserTable } from '@/components/admin/user-table'
import { Search, Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div className="admin-header-row">
          <div>
            <h1>User Management</h1>
            <p>Manage users, credit/debit wallets, and assign roles</p>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <UsersIcon size={32} />
          </div>
          <h3>No users found</h3>
          <p>
            {searchTerm
              ? 'Try a different search term'
              : 'No users have signed up yet'}
          </p>
        </div>
      ) : (
        <>
          <UserTable users={users} />
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              type="button"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              type="button"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
