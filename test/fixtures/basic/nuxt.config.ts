import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  buggregator: {
    enabled: false,
  },
})
