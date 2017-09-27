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
            return data.getJSON();
        })
    });
});

router.post('/create', function (req, resp, next) {
    try {
        var myWatchSet = new watchSet.WatchSet(req.body);
    } catch (e) {
        return resp.json({ err: 1, msg: e, stack: e.stack });
    }

    var watchSetId = 'n' + Date.now();
    watchSets[watchSetId] = myWatchSet;
    myWatchSet.id = watchSetId;
    resp.json({ err: 0, watchSet: myWatchSet.getJSON(), id: watchSetId });
});

router.param('watchset', function (req, resp, next, watchset) {
    var watchSet = watchSets[watchset];
    if (!watchSet) {
        next(new Error('watchset ' + watchset + ' could not be found'));
    } else {
        next();
    }
})
router.get('/:watchset', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];

    resp.json({ err: 0, watchSet: watchSet.getJSON() });

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

router.post('/:watchset/edit', function (req, resp, next) {
    var param = req.params.watchset;
    var oldwatchSet = watchSets[param];
    try {
        req.body.root = oldwatchSet.root;
        var newWatchSet = new watchSet.WatchSet(req.body);
    } catch (e) {
        return next(e);
    }

    watchSets[param] = newWatchSet;

    newWatchSet.id = oldwatchSet.id;
    newWatchSet.lastFiveChangeSet = oldwatchSet.lastFiveChangeSet;

    if (oldwatchSet.isWatching()) {
        oldwatchSet.stop();
        newWatchSet.watch();
    }

    resp.json({ err: 0, watchSet: newWatchSet });
});

router.post('/:watchset/test_deploy', function (req, resp, next) {
    var param = req.params.watchset;
    var watchSet = watchSets[param];
    watchSet.testDeploy(function (err) {
        if (err) {
            next(err);
        } else {
            resp.json({ err: 0 });
        }
    })
});

module.exports = router;
