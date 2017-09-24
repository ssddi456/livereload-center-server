var express = require('express');
var watchSet = require('../libs/watch_set');
var util = require('util');
var router = express.Router();

var watchSets = {};

router.get('/list', function (req, resp, next) {

    resp.json({
        err: 0,
        watchSets: Object.keys(watchSets).map(function (key) {
            var data = watchSets[key];
            data.id = key;
            return data.getJSON();
        })
    });
});

router.get('/:watchset', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];

    if (watchSet) {
        resp.json({ err: 0, watchSet: watchSet.getJSON() });
    } else {
        resp.json({ err: 1, msg: 'watch set not found' });
    }
});

router.post('/:watchset/watch', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];

    watchSet.watch();

    resp.json({ err: 0 });
});
router.post('/:watchset/stop', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];
    watchSet.stop();
    resp.json({ err: 0 });
});
router.post('/:watchset/remove', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];
    watchSet.stop();
    delete watchSet[param];

    resp.json({ err: 0 });
});

router.post('/create', function (req, resp, next) {
    try {
        var myWatchSet = new watchSet.WatchSet(req.body);
    } catch (e) {
        return resp.json({ err: 1, msg: e, stack: e.stack });
    }

    var watchSetId = 'n' + Date.now();
    watchSets[watchSetId] = myWatchSet;
    resp.json({ err: 0, watchSet: myWatchSet, id: watchSetId });
});

router.post('edit', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];

    try {
        var newWatchSet = new watchSet.WatchSet(req.body);
    } catch (e) {
        return resp.json({ err: 1, msg: e, statk: e.statk });
    }

    watchSets[param] = newWatchSet;
    newWatchSet.lastFiveChangeSet = watchSet.lastFiveChangeSet;

    if (watchSet.isWatching()) {
        watchSet.stop();
    } else {
        newWatchSet.watch();
    }

    resp.json({ err: 0, watchSet: newWatchSet });
});

module.exports = router;