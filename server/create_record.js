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
record_id = 'sillyfish'

// populate protos with the actions one can take on the system
protos.compile().then(function(){
	createTxn = getTxnCreator(agents["Huayin Pharmaceutical"].privkey, SERVERpubkey)

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
