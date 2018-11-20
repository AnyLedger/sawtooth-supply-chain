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

function post_transactions(server_url, transactions){
	// All Transactions must be submitted in a batch, even if you just have one TX. Hence TransactionList.
	// https://sawtooth.hyperledger.org/docs/core/releases/latest/_autogen/sdk_submit_tutorial_python.html#building-the-batch
	request({
		method: 'POST',
		url: `${server_url}/transactions?wait`,
		headers: { 'Content-Type': 'application/octet-stream' },
		encoding: null,
		body: TransactionList.encode({ transactions }).finish()
	 })
}

function create_tx(name, keypair) {
	// getTxnCreator() is a factory. It returns a convenience function that:
	// 1. Encodes the transaction header for you
	// 2. Signs the header for you
	// 3. Creates the Transaction from the transaction header, signature and the payload.
	createTxn = getTxnCreator(keypair.privkey, SERVERpubkey)
	// console.log(createTxn('I have a message'))

	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.CREATE_AGENT,
		createAgent: protos.CreateAgentAction.create({name: name}),
	}))
	return tx
}

function create_record(record_id, creators_keypair){
	createTxn = getTxnCreator(creators_keypair.privkey, SERVERpubkey)

	// Create a Record of type "Fish"
	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.CREATE_RECORD,
		createRecord: protos.CreateRecordAction.create({
			recordId: record_id,
			recordType: "fish",
			location: protos.Location.create(latitude=19703448,longitude=-155944975),
			properties: [
				protos.PropertyValue.create({name: 'weight', dataType: 3, numberValue: 23}), 
				protos.PropertyValue.create({name: 'length', dataType: 3, numberValue: 23}), 
				protos.PropertyValue.create({name: 'species', dataType: 4, stringValue: "BTT"}), 
				protos.PropertyValue.create({name: 'location', dataType: 7, locationValue: protos.Location.create(laittude=10000000, longitude=20000000)})
			],
		})}))
	return [tx]
}

function propose_that_an_agent_is_a_reporter_for(record_id, record_owners_keypair, reporters_pubkey){
	createTxn = getTxnCreator(record_owners_keypair.privkey, SERVERpubkey)

	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.CREATE_PROPOSAL,
		createProposal: protos.CreateProposalAction.create({
			recordId: record_id,
			receivingAgent: reporters_pubkey,
			role: protos.Proposal.Role.REPORTER,
			properties: ["temperature", "location", "tilt", "shock"]
		})
	}))
	return [tx]
}

function agent_accepts_proposal_to_be_reporter_for(record_id, agents_keypair){
	createTxn = getTxnCreator(agents_keypair.privkey, SERVERpubkey)

	// Answer Huayin Pharmaceutical's Proposal
	tx = createTxn(encodeTimestampedPayload({
		action: protos.SCPayload.Action.ANSWER_PROPOSAL,
		answerProposal: protos.AnswerProposalAction.create({
			recordId: record_id,
			receivingAgent: agents_keypair.pubkey,
			role: protos.Proposal.Role.REPORTER,
			response: protos.AnswerProposalAction.Response.ACCEPT
		})
	}))
	return [tx]
}

// Create the agents defined in agents.json
protos.compile()
	.then(function(){
			transactions = []
			for (name in agents){
				transactions.push(create_tx(name, agents[name]))
			}
			post_transactions(SERVER, transactions)
		}
	)
	.then(function(){
		txs = create_record("sillyfish", agents["Huayin Pharmaceutical"])
		post_transactions(SERVER, txs)
	})
	.then(function(){
		txs = propose_that_an_agent_is_a_reporter_for("sillyfish", agents["Huayin Pharmaceutical"], agents["Jozef's IoT Device"].pubkey)
		post_transactions(SERVER, txs)
		txs = agent_accepts_proposal_to_be_reporter_for("sillyfish", agents["Jozef's IoT Device"])
		post_transactions(SERVER, txs)
	})