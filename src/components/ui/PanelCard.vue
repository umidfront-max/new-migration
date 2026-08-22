<script setup>
defineProps({
  title: String,
  eyebrow: String,
  hint: String,
  pad: { type: Boolean, default: true },
  glow: { type: String, default: '' }, // turk | lapis | saffron | coral
})
</script>

<template>
  <section class="panel" :class="[glow && `glow-${glow}`]">
    <div v-if="title || eyebrow || $slots.actions" class="head">
      <div>
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="hint" class="hint muted">{{ hint }}</p>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </div>
    <div :class="['body', { pad }]"><slot /></div>
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  background: var(--panel-grad);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  backdrop-filter: blur(14px);
  overflow: hidden;
  transition: border-color 0.4s var(--ease-out), transform 0.4s var(--ease-out);
}

.panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--white-rgb), 0.16), transparent);
}

.panel:hover {
  border-color: var(--line-strong);
}

.glow-turk::after,
.glow-lapis::after,
.glow-saffron::after,
.glow-coral::after {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  right: -90px;
  top: -110px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: var(--glow-op);
  pointer-events: none;
}
.glow-turk::after { background: var(--turk); }
.glow-lapis::after { background: var(--lapis); }
.glow-saffron::after { background: var(--saffron); }
.glow-coral::after { background: var(--coral); }

.head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 12px;
}

.head h3 {
  font-size: 16px;
  margin-top: 4px;
}

.hint {
  font-size: 12px;
  margin: 4px 0 0;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.body {
  position: relative;
}

.body.pad {
  padding: 4px 20px 20px;
}
</style>
