import { ref } from 'vue'

/**
 * Qo'shish/tahrirlash oynasini boshqaruvchi umumiy holat.
 * Har bir sahifada: const { modal, editing, flash, openAdd, openEdit, ... } = useRecordModal()
 */
export function useRecordModal(labels = {}) {
  const modal = ref(false)
  const editing = ref(null)
  const flash = ref('')
  let timer = null

  const say = (msg) => {
    flash.value = msg
    clearTimeout(timer)
    timer = setTimeout(() => (flash.value = ''), 2600)
  }

  const openAdd = () => {
    editing.value = null
    modal.value = true
  }

  const openEdit = (row) => {
    editing.value = row
    modal.value = true
  }

  const close = () => (modal.value = false)

  const onSaved = ({ mode }) =>
    say(mode === 'add' ? labels.added || 'Yangi yozuv qo‘shildi' : labels.updated || 'Ma’lumot yangilandi')

  const onRemoved = () => say(labels.removed || 'Yozuv o‘chirildi')

  return { modal, editing, flash, openAdd, openEdit, close, onSaved, onRemoved, say }
}
