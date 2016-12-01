/**
 * Created by diego on 17/11/16.
 */
var redisClient = redis.createClient();
redisClient.on('connect', function () {
    log.logger.info('Redis %s', this.address);
});
redisClient.on('error', err => {
    log.logger.error('Ha ocurrido un error conectando con Redis %s', err);
});


router.get("/redis/set", (req, res) => {
    var json = JSON.stringify([{campo1: 1, campo2: 'OK'},{campo1: 1, campo2: 'OK'},{campo1: 1, campo2: 'OK'},{campo1: 1, campo2: 'OK'}]);
    redis.setex("test", 10000, json);
    res.status(200).send("OK");
});
router.get("/redis/get", (req, res) => {
    redis.get("test", (err, value) => {
        var json = JSON.parse(value);
        res.status(200).json(json);
    });
});
