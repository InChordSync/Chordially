import { compose, waitUntilReady } from './lib/local-network.mjs'

compose('down', '-v')
compose('up', '-d')
await waitUntilReady()
console.log('Local Stellar network was reset and is ready.')
