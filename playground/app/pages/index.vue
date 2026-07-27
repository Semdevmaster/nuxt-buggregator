<script setup lang="ts">
const ray = useRay()

const examples = {
  string: 'hello world',
  array: ['one', 'two', 3, true, null],
  object: {
    user: 'semnix',
    nested: { ok: true, items: [1, 2] },
  },
  json: {
    id: 42,
    tags: ['nuxt', 'ray'],
    meta: { active: true },
  },
  map: new Map<string, unknown>([
    ['role', 'admin'],
    ['permissions', ['read', 'write']],
  ]),
  set: new Set(['alpha', 'beta', 'alpha', 1]),
}

function sendString() {
  ray(examples.string)
}

function sendArray() {
  ray(examples.array)
}

function sendObject() {
  ray(examples.object)
}

function sendJson() {
  ray().json(JSON.stringify(examples.json))
  ray().toJson(examples.json)
}

function sendMap() {
  ray(examples.map)
}

function sendSet() {
  ray(examples.set)
}

function sendChain() {
  ray('chain demo').green().label('demo').large()
}

function sendAll() {
  sendString()
  sendArray()
  sendObject()
  sendJson()
  sendMap()
  sendSet()
  sendChain()
}
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <h1 class="text-2xl font-semibold">Ray examples</h1>

    <div class="flex flex-wrap gap-2">
      <UButton @click="sendString">string</UButton>
      <UButton @click="sendArray">array</UButton>
      <UButton @click="sendObject">object</UButton>
      <UButton @click="sendJson">json</UButton>
      <UButton @click="sendMap">map</UButton>
      <UButton @click="sendSet">set</UButton>
      <UButton @click="sendChain">chain</UButton>
      <UButton color="neutral" variant="soft" @click="sendAll">all</UButton>
    </div>
  </div>
</template>
