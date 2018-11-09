const secp256k1 = require('sawtooth-sdk/signing/secp256k1')

const context = new secp256k1.Secp256k1Context()
privkey = context.newRandomPrivateKey()
pubkey = context.getPublicKey(privkey)
console.log("private", privkey.asHex(), "public", pubkey.asHex())
