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
  TransactionList,
} = require('sawtooth-sdk/protobuf')
const agents = require('./agents.json')

// First, point to where the supply-server REST API is. For some reason, you need its public key to send txs to it.
const SERVER = 'http://localhost:8020'
const SERVERpubkey = '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa'

// And it should be registered as a Reporter to this Record:
record_id = process.argv[2]

// populate protos with the actions one can take on the system
protos.compile().then(function(){
	createTxn = getTxnCreator(agents["Huayin Pharmaceutical"].privkey, SERVERpubkey)

	// I Hereby Propose that Jozef's IoT Device is a Reporter of this Record ID for 'temperature'
	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.CREATE_PROPOSAL,
		createProposal: protos.CreateProposalAction.create({
			recordId: record_id,
			receivingAgent: agents["Jozef's IoT Device"].pubkey,
			properties: ["temperature"],
			role: protos.Proposal.Role.REPORTER}),
	}))
	transactions = [tx]

	request({
		method: 'POST',
		url: `${SERVER}/transactions?wait`,
		headers: { 'Content-Type': 'application/octet-stream' },
		encoding: null,
		body: TransactionList.encode({ transactions }).finish()
	 })
}
)
