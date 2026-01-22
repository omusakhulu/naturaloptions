import prisma from '@/lib/prisma'

export type RoleMenuAccessMap = Record<string, string[]>

const STORE_SETTING_KEY = 'role_menu_access'

export async function getRoleMenuAccessMap(): Promise<RoleMenuAccessMap> {
  const setting = await prisma.storeSetting.findUnique({
    where: { key: STORE_SETTING_KEY },
    select: { value: true }
  })

  if (!setting?.value) return {}

  try {
    const parsed = JSON.parse(setting.value)

    if (!parsed || typeof parsed !== 'object') return {}

    return parsed as RoleMenuAccessMap
  } catch {
    return {}
  }
}

export async function setRoleMenuAccessMap(map: RoleMenuAccessMap): Promise<void> {
  const value = JSON.stringify(map || {})

  await prisma.storeSetting.upsert({
    where: { key: STORE_SETTING_KEY },
    update: { value, group: 'permissions' },
    create: { key: STORE_SETTING_KEY, value, group: 'permissions' }
  })
}

export function roleHasMenuAccess(role: string | undefined | null, allowedKeys: string[] | undefined, itemKey: string) {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true
  if (!allowedKeys) return false

  return allowedKeys.includes(itemKey)
}
