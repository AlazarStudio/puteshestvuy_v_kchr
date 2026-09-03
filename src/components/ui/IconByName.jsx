import { getMuiIconComponent } from '@/app/admin/components/WhatToBringIcons'

/** Рендер иконки lucide по имени из контента. Точка входа в полный реестр иконок. */
export default function IconByName({ name, ...props }) {
  const Icon = getMuiIconComponent(name)
  return Icon ? <Icon {...props} /> : null
}
