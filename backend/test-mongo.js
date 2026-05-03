const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('MongoMemoryServer URI:', uri);
    await mongod.stop();
  } catch (err) {
    console.error('Error starting MongoMemoryServer:', err);
  }
})();
