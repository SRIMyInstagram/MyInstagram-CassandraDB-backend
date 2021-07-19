const { Client } = require("cassandra-driver");

const connectDB = async () => {
    try {
        const client = new Client({
            contactPoints: ['127.0.0.1'],
            localDataCenter: 'datacenter1',});
        await client.connect().catch(e => console.error(e));
        console.log('Connected to Cassandra DB')
    
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
  
  module.exports = connectDB

