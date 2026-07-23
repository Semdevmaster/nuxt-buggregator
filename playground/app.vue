<template>
  <div>
    <h1>nuxt-buggregator playground</h1>
    <button type="button" @click="send">Send to Buggregator</button>
  </div>
</template>

<script setup lang="ts">
const ray = useRay()

function send() {
  ray('hello from playground').green().label('playground')
}
</script>
