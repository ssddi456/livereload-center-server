var express = require('express');
var watchSet = require('../libs/watch_set');
var util = require('util');
var router = express.Router();
var storage = require('../libs/storage');
var EventEmitter = require('events').EventEmitter;
var readyEvent = new EventEmitter();

var watchSetInitaled = false;
var watchSets = {};

storage.find({}, function (err, docs) {
    console.log('watchsets load done');
    if (err) {
        console.log('watch sets load feiled!!', err);
    } else {
        console.log('watchsets loaded', docs);
        docs.forEach(function (doc) {
            var param = doc._id;
            var myWatchSet = new watchSet.WatchSet(doc);
            myWatchSet.id = param;
            watchSets[param] = myWatchSet;
        });
    }
    watchSetInitaled = true;
    readyEvent.emit('ready');
})

router.use(function (req, resp, next) {
    console.log('watchSetInitaled', watchSetInitaled);

    if (watchSetInitaled) {
        
        next();
    } else {
        readyEvent.once('ready', function () {
            next();
        });
    }
});

router.get('/list', function (req, resp, next) {
    storage.find({}).exec(function (err, docs) {
        if (err) {
            return next(err);
        } else {

        }
    });
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
    var doc = myWatchSet.getJSON();

    delete doc.lastFiveChangeSet;
    delete doc.isWatching;
    delete doc.id;

    storage.insert(doc, function (err, newDoc) {
        if (err) {
            return next(err);
        } else {
            var watchSetId = newDoc._id;
            watchSets[watchSetId] = myWatchSet;
            myWatchSet.id = watchSetId;
            doc.id = watchSetId;
            resp.json({ err: 0, watchSet: doc, id: watchSetId });
        }
    })
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

    storage.remove({ _id: param }, function () {
        resp.json({ err: 0 });
    });
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

    var doc = newWatchSet.getJSON();

    storage.update({ _id: param }, {
        $set: {
            includes: doc.includes,
            excludes: doc.excludes,
            deployApi: doc.deployApi,
            deployPath: doc.deployPath,
        }
    }, {}, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            watchSets[param] = newWatchSet;

            newWatchSet.id = oldwatchSet.id;
            newWatchSet.lastFiveChangeSet = oldwatchSet.lastFiveChangeSet;

            if (oldwatchSet.isWatching()) {
                oldwatchSet.stop();
                newWatchSet.watch();
            }

            resp.json({ err: 0, watchSet: newWatchSet });
        }
    })
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
