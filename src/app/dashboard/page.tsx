'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import {
  getAdminStats,
  getAdminUsers,
  getDepartmentsList,
  getWorkShiftsList,
  getRolesList,
  updateUserOrg,
  syncOrgGroups,
  createDepartment,
  createWorkShift,
  AdminDashboardStats,
  DirectoryUser,
  WorkShiftItem,
  RoleItem
} from '@/lib/org-api'
import { ZaloBroadcastModal } from '@/components/zalo/zalo-broadcast-modal'
import { ZaloPhoneSimulator } from '@/components/zalo/zalo-phone-simulator'
import { ZaloNotificationLogItem } from '@/lib/zalo-api'
import { logoutUser } from '@/services/api/auth'
import { UserSettingsModal } from '@/components/settings/user-settings-modal'
import { UserAvatar } from '@/components/chat/user-avatar'
import { useTheme } from '@/context/theme-context'
import { Sun, Moon, Palette } from 'lucide-react'

const stats = [
  { label: 'Tổng doanh thu', value: '₫128.4M', change: '+12.8%', note: 'so với tháng trước', icon: CircleDollarSign, trend: 'up' },
  { label: 'Đơn hàng', value: '1,284', change: '+8.4%', note: 'so với tháng trước', icon: ShoppingBag, trend: 'up' },
  { label: 'Khách hàng mới', value: '482', change: '+18.2%', note: 'so với tháng trước', icon: Users, trend: 'up' },
  { label: 'Tỷ lệ chuyển đổi', value: '6.24%', change: '-2.1%', note: 'so với tháng trước', icon: Activity, trend: 'down' },
]

const orders = [
  { id: '#DH-10482', customer: 'Nguyễn Minh Anh', product: 'Gói Pro hàng tháng', amount: '₫1.290.000', status: 'Đã thanh toán', time: '12 phút trước' },
  { id: '#DH-10481', customer: 'Trần Hoàng Nam', product: 'Gói Business', amount: '₫2.990.000', status: 'Đang xử lý', time: '34 phút trước' },
  { id: '#DH-10480', customer: 'Lê Phương Thảo', product: 'Gói Pro hàng tháng', amount: '₫1.290.000', status: 'Đã thanh toán', time: '1 giờ trước' },
  { id: '#DH-10479', customer: 'Phạm Đức Long', product: 'Gói Starter', amount: '₫490.000', status: 'Đã hủy', time: '2 giờ trước' },
]

  // Filters for User Table
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState<string>('')
  const [filterShift, setFilterShift] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null)
  const [editDeptId, setEditDeptId] = useState<string>('')
  const [editShiftId, setEditShiftId] = useState<string>('')
  const [editPosition, setEditPosition] = useState<string>('')
  const [editRoleId, setEditRoleId] = useState<string>('')
  const [editIsActive, setEditIsActive] = useState<boolean>(true)
  const [isSavingUser, setIsSavingUser] = useState(false)

  // Create Department Modal
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptCode, setNewDeptCode] = useState('')
  const [newDeptAutoGroup, setNewDeptAutoGroup] = useState(true)
  const [isSavingDept, setIsSavingDept] = useState(false)

  // Create Shift Modal
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false)
  const [newShiftName, setNewShiftName] = useState('')
  const [newShiftCode, setNewShiftCode] = useState('')
  const [newShiftStart, setNewShiftStart] = useState('06:00')
  const [newShiftEnd, setNewShiftEnd] = useState('14:00')
  const [newShiftDeptId, setNewShiftDeptId] = useState('')
  const [isSavingShift, setIsSavingShift] = useState(false)

  // Zalo Notification Simulator Modals
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false)
  const [isZaloSimOpen, setIsZaloSimOpen] = useState(false)
  const [zaloLogs, setZaloLogs] = useState<ZaloNotificationLogItem[]>([])

  // User Settings Modal & Theme
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'avatar' | 'theme'>('avatar')
  const { effectiveTheme, toggleTheme } = useTheme()

  // Real-time listener for user profile / avatar updates
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const custom = e as CustomEvent<any>
      if (custom.detail) {
        setCurrentUser((prev: any) => ({ ...prev, ...custom.detail }))
      }
    }
    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate)
  }, [])

  // Auth & Admin Guard
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // Load User & Strict Admin Auth Guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          const userObj = JSON.parse(stored)
          const role = (userObj?.roleName || '').toLowerCase().trim()
          if (role !== 'admin') {
            setIsAuthorized(false)
            router.replace('/chat')
            return
          }
          setCurrentUser(userObj)
          setIsAuthorized(true)
        } catch {
          setIsAuthorized(false)
          router.replace('/login')
        }
      } else {
        setIsAuthorized(false)
        router.replace('/login')
      }
    }
  }, [router])

  // Load Dashboard Data only when authorized
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, deptsData, shiftsData, rolesData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getDepartmentsList(),
        getWorkShiftsList(),
        getRolesList(),
      ])

      setStats(statsData)
      setUsers(usersData)
      setDepartments(deptsData)
      setShifts(shiftsData)
      setRoles(rolesData)
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  // Handle Sync All Org Groups
  const handleSyncGroups = async () => {
    setIsSyncing(true)
    setSyncToast(null)
    try {
      const res = await syncOrgGroups()
      setSyncToast({
        type: 'success',
        message: res.message || 'Đồng bộ nhóm tổ chức phòng ban và ca trực thành công!',
      })
      await loadData()
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: err.message || 'Có lỗi xảy ra khi đồng bộ nhóm chat.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Open Edit User Modal
  const handleOpenEditUser = (u: DirectoryUser) => {
    setEditingUser(u)
    setEditDeptId(u.departmentId || '')
    setEditShiftId(u.workShiftId || '')
    setEditPosition(u.positionTitle || '')
    setEditRoleId(u.roleId || '')
    setEditIsActive(u.isActive)
  }

  // Save User Edit
  const handleSaveUserOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSavingUser(true)

    try {
      await updateUserOrg(editingUser.id, {
        departmentId: editDeptId || null,
        workShiftId: editShiftId || null,
        positionTitle: editPosition || undefined,
        roleId: editRoleId || undefined,
        isActive: editIsActive,
      })

      setEditingUser(null)
      setSyncToast({
        type: 'success',
        message: `Đã cập nhật thông tin và đồng bộ nhóm chat cho nhân viên ${editingUser.fullName}!`,
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật nhân viên.')
    } finally {
      setIsSavingUser(false)
    }
  }

  // Save New Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeptName.trim()) return
    setIsSavingDept(true)

    try {
      await createDepartment({
        name: newDeptName.trim(),
        code: newDeptCode.trim() || undefined,
        autoCreateGroup: newDeptAutoGroup,
      })

      setIsCreateDeptOpen(false)
      setNewDeptName('')
      setNewDeptCode('')
      setSyncToast({
        type: 'success',
        message: 'Tạo phòng ban và nhóm chat mặc định thành công!',
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo phòng ban.')
    } finally {
      setIsSavingDept(false)
    }
  }

  // Save New Shift
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShiftName.trim()) return
    setIsSavingShift(true)

    try {
      await createWorkShift({
        name: newShiftName.trim(),
        code: newShiftCode.trim() || undefined,
        startTime: newShiftStart + ':00',
        endTime: newShiftEnd + ':00',
        departmentId: newShiftDeptId || null,
      })

      setIsCreateShiftOpen(false)
      setNewShiftName('')
      setNewShiftCode('')
      setSyncToast({
        type: 'success',
        message: 'Tạo ca làm việc và nhóm chat ca trực thành công!',
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo ca trực.')
    } finally {
      setIsSavingShift(false)
    }
  }

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.positionTitle && u.positionTitle.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchDept = !filterDept || u.departmentId === filterDept
    const matchShift = !filterShift || u.workShiftId === filterShift
    const matchRole = !filterRole || u.roleId === filterRole

    return matchSearch && matchDept && matchShift && matchRole
  })

  // Prevent unauthorized view flicker
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center animate-in fade-in duration-200">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Đang xác thực quyền Quản trị viên...</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Hệ thống đang kiểm tra quyền truy cập MES Admin Portal.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar px-4 py-5 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><span className="text-lg font-bold">N</span></div><span className="text-lg font-semibold tracking-tight">Nexus</span></div>
          <button className="rounded-lg p-2 text-muted-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X /></button>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsZaloModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-[#0068FF]/10 text-[#0068FF] hover:bg-[#0068FF]/20 px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
            title="Đẩy thông báo ca học qua Zalo OA (Mô phỏng 100% Free)"
          >
            <Sparkles className="size-3.5" />
            <span>Gửi Zalo OA (Simulator)</span>
          </button>

          <button
            onClick={handleSyncGroups}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted transition disabled:opacity-50 cursor-pointer shadow-xs"
            title="Đồng bộ lại toàn bộ nhóm chat theo nhân sự mới nhất"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ nhóm chat'}</span>
          </button>

          {/* Theme Quick Toggle & Palette */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center size-9 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shadow-xs"
            title={effectiveTheme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
            aria-label="Đổi chế độ Sáng / Tối"
          >
            {effectiveTheme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setSettingsTab('theme')
              setIsSettingsOpen(true)
            }}
            className="flex items-center justify-center size-9 rounded-xl border border-border bg-background text-muted-foreground hover:text-primary hover:bg-primary/10 transition cursor-pointer shadow-xs"
            title="Cài đặt Giao diện & Tông màu"
            aria-label="Cài đặt Giao diện"
          >
            <Palette className="size-4" />
          </button>

          {/* Quick link to Chat app */}
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
          >
            <MessageSquare className="size-4" />
            <span>Mở Ứng dụng Chat</span>
            <ArrowRight className="size-3.5 hidden sm:inline" />
          </Link>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <button
              type="button"
              onClick={() => {
                setSettingsTab('avatar')
                setIsSettingsOpen(true)
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group hover:opacity-80 transition"
              title="Nhấn để đổi Ảnh đại diện & Cài đặt hồ sơ"
            >
              <UserAvatar
                src={currentUser?.avatarUrl}
                name={currentUser?.fullName}
                emoji={currentUser?.avatarEmoji}
                gradient={currentUser?.avatarBg}
                size="sm"
                isOnline={true}
                className="transition group-hover:scale-105"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-tight truncate max-w-[120px] text-foreground group-hover:text-primary transition">
                  {currentUser?.fullName || 'Quản trị viên'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">Admin Portal</p>
              </div>
            </button>
            <button
              onClick={() => {
                logoutUser()
                router.push('/login')
              }}
              title="Đăng xuất khỏi hệ thống"
              aria-label="Đăng xuất"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span className="hidden xl:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Toast Notification */}
        {syncToast && (
          <div
            className={`flex items-center justify-between gap-2 p-3.5 rounded-xl border animate-in slide-in-from-top duration-200 ${
              syncToast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {syncToast.type === 'success' ? (
                <CheckCircle2 className="size-4.5 shrink-0" />
              ) : (
                <AlertCircle className="size-4.5 shrink-0" />
              )}
              <span>{syncToast.message}</span>
            </div>
            <button onClick={() => setSyncToast(null)} className="hover:opacity-70 p-1">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0 ${
              activeTab === 'overview'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Tổng quan & KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0 ${
              activeTab === 'users'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Users className="size-4" />
            <span>Quản lý Nhân sự & Phòng ban ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0 ${
              activeTab === 'departments'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Building2 className="size-4" />
            <span>Cơ cấu Phòng ban ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0 ${
              activeTab === 'shifts'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Clock className="size-4" />
            <span>Ca làm việc ({shifts.length})</span>
          </button>
        </div>

        {/* ─── TAB 1: OVERVIEW & KPIS ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tổng Nhân sự</span>
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Users className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tracking-tight">{stats?.totalUsers || users.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    {stats?.activeUsersCount || users.filter((u) => u.isActive).length} đang hoạt động
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Phòng ban</span>
                  <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
                    <Building2 className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tracking-tight">{stats?.totalDepartments || departments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cơ cấu tổ chức doanh nghiệp</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Nhóm Chat Tổ chức</span>
                  <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
                    <MessageSquare className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tracking-tight">{stats?.totalOrgGroups || departments.length + shifts.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tự động đồng bộ theo phòng/ca</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Ca làm việc</span>
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
                    <Clock className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tracking-tight">{stats?.totalWorkShifts || shifts.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ca sản xuất & trực nhật</p>
                </div>
              </div>
            </div>

            {/* Department Breakdown Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <h3 className="text-base font-bold mb-1">Phân bổ Nhân sự theo Phòng ban</h3>
                <p className="text-xs text-muted-foreground mb-5">Số lượng nhân viên chính thức theo từng đơn vị</p>

                <div className="space-y-3.5">
                  {departments.map((d) => {
                    const count = users.filter((u) => u.departmentId === d.id).length
                    const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
                    return (
                      <div key={d.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-primary" />
                            {d.name} ({d.code || 'N/A'})
                          </span>
                          <span>{count} nhân sự ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions & Automation Guide */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold mb-1">Quy tắc Đồng bộ Nhóm Hệ thống (MES-015)</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Hệ thống tự động duy trì danh sách thành viên nhóm chat theo cơ cấu nhân sự thực tế.
                  </p>

                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                      <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong>Bảo vệ Nhóm (`IsSystemGroup`):</strong> Thành viên thông thường không thể tự xóa hoặc rời nhóm phòng ban.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                      <RefreshCw className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Tự động luân chuyển:</strong> Khi đổi phòng ban/ca, nhân viên tự động được thêm vào nhóm mới và rút khỏi nhóm cũ kèm tin nhắn hệ thống.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                      <FolderTree className="size-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Danh bạ cây thư mục:</strong> Nhân viên tra cứu đồng nghiệp dễ dàng tại Tab Danh bạ trong không gian Chat.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold">Cần đồng bộ lại toàn bộ?</span>
                  <button
                    onClick={handleSyncGroups}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Chạy đồng bộ ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: USERS MANAGEMENT & ORG ASSIGNMENT ─────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo họ tên, username, chức vụ..."
                  className="w-full h-10 rounded-xl border border-input bg-card pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">Tất cả ca trực</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">Tất cả vai trò</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="px-5 py-3.5">Họ tên & Tài khoản</th>
                      <th className="px-4 py-3.5">Phòng ban</th>
                      <th className="px-4 py-3.5">Chức danh</th>
                      <th className="px-4 py-3.5">Ca làm việc</th>
                      <th className="px-4 py-3.5">Vai trò</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                                {u.fullName ? u.fullName.substring(0, 2).toUpperCase() : 'NV'}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{u.fullName}</p>
                                <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {u.departmentName ? (
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Building2 className="size-3 text-primary" />
                                {u.departmentName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Chưa phân phòng</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {u.positionTitle ? (
                              <span className="font-medium text-foreground">{u.positionTitle}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Chưa cập nhật</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {u.workShiftName ? (
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <Clock className="size-3 text-amber-500" />
                                {u.workShiftName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Giờ hành chính</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                u.roleName === 'Admin'
                                  ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {u.roleName || 'User'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                                <span className="size-1.5 rounded-full bg-muted-foreground" />
                                Vô hiệu
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              <Edit3 className="size-3" />
                              <span>Sửa</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DEPARTMENTS MANAGEMENT ──────────────────────────────── */}
        {activeTab === 'departments' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Cơ cấu Phòng ban Doanh nghiệp</h3>
                <p className="text-xs text-muted-foreground">Mỗi phòng ban có một nhóm chat hệ thống tự động đồng bộ thành viên</p>
              </div>
              <button
                onClick={() => setIsCreateDeptOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Thêm phòng ban mới</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((d) => {
                const deptMembers = users.filter((u) => u.departmentId === d.id)
                return (
                  <div key={d.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="size-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{d.name}</h4>
                            <p className="text-[11px] text-muted-foreground">Mã: {d.code || 'N/A'}</p>
                          </div>
                        </div>
                        {d.autoCreateGroup && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                            Nhóm Auto
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Số lượng nhân sự:</span>
                        <span className="font-bold text-foreground">{deptMembers.length} người</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                      <Link
                        href={`/chat/${d.defaultConversationId || ''}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="size-3" /> Vào nhóm chat
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 4: SHIFTS MANAGEMENT ───────────────────────────────────── */}
        {activeTab === 'shifts' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Quản lý Ca làm việc</h3>
                <p className="text-xs text-muted-foreground">Tổ chức ca trực sản xuất và nhóm liên lạc ca tự động</p>
              </div>
              <button
                onClick={() => setIsCreateShiftOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-xs cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Thêm ca làm việc</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((s) => {
                const shiftMembers = users.filter((u) => u.workShiftId === s.id)
                return (
                  <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Clock className="size-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{s.name}</h4>
                            <p className="text-[11px] text-muted-foreground">Mã: {s.code || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Khung giờ:</span>
                          <span className="font-semibold text-foreground">
                            {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Nhân sự trong ca:</span>
                          <span className="font-bold text-foreground">{shiftMembers.length} người</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                      <Link
                        href={`/chat/${s.defaultConversationId || ''}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="size-3" /> Vào nhóm chat ca
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: EDIT USER ORG ASSIGNMENT ─────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold">Chỉnh sửa Tổ chức & Phòng ban</h3>
                <p className="text-xs text-muted-foreground">
                  Nhân viên: <strong className="text-foreground">{editingUser.fullName}</strong> (@{editingUser.username})
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserOrg} className="space-y-4 text-xs">
              {/* Alert notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="size-4 shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ <strong>tự động chuyển nhóm chat</strong> phòng ban và ca trực tương ứng cho nhân viên này ngay sau khi lưu.
                </span>
              </div>

              {/* Department selection */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Phòng ban</label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">-- Chưa phân phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Shift selection */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ca làm việc</label>
                <select
                  value={editShiftId}
                  onChange={(e) => setEditShiftId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">-- Giờ hành chính / Mặc định --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Position Title */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Chức danh / Vị trí</label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="VD: Trưởng phòng, Kỹ sư cơ khí, Công nhân ép dập..."
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Vai trò hệ thống</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-foreground">Trạng thái tài khoản</p>
                  <p className="text-[11px] text-muted-foreground">Vô hiệu hóa sẽ tự động kick khỏi toàn bộ nhóm tổ chức</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="size-5 rounded border-border text-primary focus:ring-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingUser ? <Loader2 className="size-4 animate-spin" /> : null}
                  <span>Lưu & Tự động đổi nhóm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE DEPARTMENT ────────────────────────────────────────── */}
      {isCreateDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold">Thêm Phòng ban Mới</h3>
              <button onClick={() => setIsCreateDeptOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tên phòng ban *</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="VD: Phòng Nghiên cứu & Phát triển (R&D)"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Mã phòng ban</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="VD: RND"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoGroup"
                  checked={newDeptAutoGroup}
                  onChange={(e) => setNewDeptAutoGroup(e.target.checked)}
                  className="size-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="autoGroup" className="text-muted-foreground font-medium">
                  Tự động tạo Nhóm Chat mặc định cho phòng này
                </label>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeptOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingDept}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingDept ? 'Đang tạo...' : 'Tạo phòng ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE WORK SHIFT ────────────────────────────────────────── */}
      {isCreateShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold">Thêm Ca Làm Việc Mới</h3>
              <button onClick={() => setIsCreateShiftOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tên ca *</label>
                <input
                  type="text"
                  required
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="VD: Ca Hành chính, Ca Tăng cường"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Mã ca</label>
                <input
                  type="text"
                  value={newShiftCode}
                  onChange={(e) => setNewShiftCode(e.target.value)}
                  placeholder="VD: SHIFT_HC"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateShiftOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingShift}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingShift ? 'Đang tạo...' : 'Tạo ca làm việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Zalo Broadcast Modal */}
      <ZaloBroadcastModal
        isOpen={isZaloModalOpen}
        onClose={() => setIsZaloModalOpen(false)}
        onSuccessOpenSimulator={(logs) => {
          setZaloLogs(logs)
          setIsZaloSimOpen(true)
        }}
      />

      {/* Zalo Phone Simulator Widget */}
      <ZaloPhoneSimulator
        isOpen={isZaloSimOpen}
        onClose={() => setIsZaloSimOpen(false)}
        notifications={zaloLogs}
      />

      {/* User Settings & Avatar/Theme Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </div>
  )
}
