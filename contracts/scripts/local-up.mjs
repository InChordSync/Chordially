import { compose, waitUntilReady } from './lib/local-network.mjs'

compose('up', '-d')
await waitUntilReady()
console.log('Local Stellar network is ready.')
