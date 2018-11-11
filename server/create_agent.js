const request = require('request-promise-native')
const protos = require('./blockchain/protos')
const {
  awaitServerPubkey,
  getTxnCreator,
  submitTxns,
  encodeTimestampedPayload
} = require('./system/submit_utils')
const {
  Transaction,
  TransactionHeader,
  TransactionList
} = require('sawtooth-sdk/protobuf')
const agents = require('./agents.json')

// First, point to where the supply-server REST API is. For some reason, you need its public key to send txs to it.
const SERVER = 'http://localhost:8020'
const SERVERpubkey = '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa'


// populate protos with the actions one can take on the system
protos.compile().then(
	function () {
		transactions = []
		for (name in agents){
			transactions.push(create_tx(name, agents[name]))
		}
		return transactions
	}
).then(function(transactions){
	// All Transactions must be submitted in a batch, even if you just have one TX. Hence TransactionList.
	// https://sawtooth.hyperledger.org/docs/core/releases/latest/_autogen/sdk_submit_tutorial_python.html#building-the-batch
	request({
		method: 'POST',
		url: `${SERVER}/transactions?wait`,
		headers: { 'Content-Type': 'application/octet-stream' },
		encoding: null,
		body: TransactionList.encode({ transactions }).finish()
	 })
})

function create_tx(name, agent) {
	// getTxnCreator() is a factory. It returns a convenience function that:
	// 1. Encodes the transaction header for you
	// 2. Signs the header for you
	// 3. Creates the Transaction from the transaction header, signature and the payload.
	createTxn = getTxnCreator(agent.privkey, SERVERpubkey)
	// console.log(createTxn('I have a message'))

	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.CREATE_AGENT,
		createAgent: protos.CreateAgentAction.create({name: name}),
	}))
	return tx
}
