import api from './axios'

export interface DirectoryUser {
  id: string
  username: string
  fullName: string
  email?: string
  avatarUrl?: string
  departmentId?: string
  departmentName?: string
  departmentCode?: string
  workShiftId?: string
  workShiftName?: string
  roleId?: string
  roleName?: string
  positionTitle?: string
  isActive: boolean
}

export interface DepartmentTreeNode {
  id: string
  name: string
  code: string
  parentDepartmentId?: string
  autoCreateGroup: boolean
  defaultConversationId?: string
  userCount: number
  users: DirectoryUser[]
  subDepartments: DepartmentTreeNode[]
}

export interface WorkShiftItem {
  id: string
  name: string
  code: string
  startTime: string
  endTime: string
  departmentId?: string
  departmentName?: string
  defaultConversationId?: string
  userCount: number
  users?: DirectoryUser[]
}

export interface AdminDashboardStats {
  totalUsers: number
  totalDepartments: number
  totalWorkShifts: number
  totalOrgGroups: number
  activeUsersCount: number
  totalTasks: number
  departmentBreakdown: {
    departmentId: string
    departmentName: string
    userCount: number
  }[]
}

export interface RoleItem {
  id: string
  name: string
}

// ─── Directory API Functions ──────────────────────────────────────────────────

export async function getOrgTree(): Promise<DepartmentTreeNode[]> {
  const res = await api.get('/directory/tree')
  return res.data?.data || []
}

export async function getDirectoryUsers(params?: {
  search?: string
  departmentId?: string
  workShiftId?: string
  isActive?: boolean
}): Promise<DirectoryUser[]> {
  const res = await api.get('/directory/users', { params })
  return res.data?.data || []
}

export async function getDepartmentsList(): Promise<{
  id: string
  name: string
  code: string
  parentDepartmentId?: string
  autoCreateGroup: boolean
  defaultConversationId?: string
  userCount: number
}[]> {
  const res = await api.get('/directory/departments')
  return res.data?.data || []
}

export async function getWorkShiftsList(): Promise<WorkShiftItem[]> {
  const res = await api.get('/directory/shifts')
  return res.data?.data || []
}

// ─── Admin API Functions ──────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminDashboardStats> {
  const res = await api.get('/admin/dashboard/stats')
  return res.data?.data
}

export async function getAdminUsers(params?: {
  search?: string
  departmentId?: string
  workShiftId?: string
  roleId?: string
  isActive?: boolean
}): Promise<DirectoryUser[]> {
  const res = await api.get('/admin/users', { params })
  return res.data?.data || []
}

export async function updateUserOrg(
  userId: string,
  data: {
    departmentId?: string | null
    workShiftId?: string | null
    positionTitle?: string
    roleId?: string
    isActive?: boolean
  }
): Promise<{ success: boolean; message: string }> {
  const res = await api.put(`/admin/users/${userId}/org`, data)
  return res.data
}

export async function syncOrgGroups(): Promise<{
  createdGroupsCount: number
  updatedMembersCount: number
  message: string
}> {
  const res = await api.post('/admin/org/sync-groups')
  return res.data?.data
}

export async function createDepartment(data: {
  name: string
  code?: string
  parentDepartmentId?: string | null
  autoCreateGroup?: boolean
}) {
  const res = await api.post('/admin/org/departments', data)
  return res.data?.data
}

export async function updateDepartment(
  id: string,
  data: {
    name: string
    code?: string
    parentDepartmentId?: string | null
    autoCreateGroup?: boolean
  }
) {
  const res = await api.put(`/admin/org/departments/${id}`, data)
  return res.data
}

export async function createWorkShift(data: {
  name: string
  code?: string
  startTime: string
  endTime: string
  departmentId?: string | null
}) {
  const res = await api.post('/admin/org/shifts', data)
  return res.data?.data
}

export async function getRolesList(): Promise<RoleItem[]> {
  const res = await api.get('/admin/roles')
  return res.data?.data || []
}
