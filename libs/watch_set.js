var path = require('path');
var minimatch = require('minimatch');
var assert = require('assert');
var watchr = require('watchr');
var _ = require('underscore');

function WatchSet(options) {
    options = options || {};
    options.root = options.root || '';
    options.excludes = options.excludes || [];
    options.includes = options.includes || [];

    assert.notEqual(options.root, '', 'watch set could not watch on empty path');

    this.root = options.root;
    this.includes = [];
    this.includesInfo = [];
    this.excludes = [];
    this.excludesInfo = [];

    this.stalker = undefined;

    this.lastFiveChangeSet = [];
    this.lastGetInterval = 100;
    this.lastGetTime = 0;
    this.currentChangeSet = undefined;

    var self = this;

    options.includes.forEach(function (includeGlob, i) {
        self.includes[i] = minimatch.filter(includeGlob, { matchBase: true });
        self.includesInfo.push(includeGlob);
    });

    options.excludes.forEach(function (excludeGlob, i) {
        self.excludes[i] = minimatch.filter(excludeGlob, { matchBase: true });
        self.excludesInfo.push(excludeGlob);
    });

    if (this.includes.length == 0) {
        this.includes.push(minimatch.filter('*/**', { matchBase: true }));
        this.includesInfo.push('*/**');
    }
}

var wSp = WatchSet.prototype;
wSp.process = function (fileInfos) {

};
wSp.getJSON = function () {
    var lastFiveChangeSet = this.lastFiveChangeSet;
    console.log(lastFiveChangeSet.length);

    var ret = [];

    for (var i = 0; i < lastFiveChangeSet.length; i++) {
        var element = lastFiveChangeSet[i];
        ret.push(element.toJSON());
    }

    return {
        root: this.root,
        id: this.id,
        isWatching: this.isWatching(),
        includes: this.includesInfo,
        excludes: this.excludesInfo,
        lastFiveChangeSet: ret.map(function (changeSet) {
            return changeSet.getJSON();
        })
    }
}

wSp.checkPath = function (filename) {
    var rPath = path.relative(filename, this.root);
    for (var i = 0; i < this.includes.length; i++) {
        var shouldInclude = this.includes[i];
        if (!shouldInclude(rPath)) {
            return false;
        }
    }

    for (var i = 0; i < this.excludes.length; i++) {
        var shouldExclude = this.excludes[i];
        if (shouldExclude(rPath)) {
            return false;
        }
    }

    return true;
};

wSp.getCurrentChangeSet = function () {
    var now = Date.now();
    if (!this.currentChangeSet || now - this.lastGetTime > this.lastGetInterval) {
        this.currentChangeSet = new ChangeSet(this.process.bind(this));
        // this.lastFiveChangeSet.unshift(this.currentChangeSet);
        if (this.lastFiveChangeSet.length > 5) {
            this.lastFiveChangeSet.length = 5;
        }
        this.lastGetTime = now;
        return this.currentChangeSet;
    } else {
        this.lastGetTime = now;
        return this.currentChangeSet;
    }
};
wSp.isWatching = function () {
    return !!this.stalker;
};
wSp.watch = function () {
    if (this.stalker) {
        return;
    }
    var stalker = this.stalker = watchr.create(this.root);
    stalker.setConfig({
        stat: null,
        interval: 5007,
        persistent: true,
        catchupDelay: 2000,
        preferredMethods: ['watch', 'watchFile'],
        followLinks: true,
        ignorePaths: false,
        ignoreHiddenFiles: false,
        ignoreCommonPatterns: true,
        ignoreCustomPatterns: null
    });
    stalker.watch(this.listen.bind(this));
};

wSp.listen = function (changeType, fullPath, currentStat, previousStat) {
    switch (changeType) {
        case 'update':
        case 'create':
            console.log('the file', fullPath, 'was created or update', currentStat);
            var changeSet = this.getCurrentChangeSet();
            if (this.checkPath(fullPath)) {
                changeSet.push({ fullPath: fullPath, match: true });
            } else {
                changeSet.push({ fullPath: fullPath, match: false });
            }
            break
        case 'delete':
            console.log('the file', fullPath, 'was deleted', previousStat)
            break
    }
};

wSp.stop = function () {
    if (!this.stalker) {
        this.stalker.close();
    }
};


function ChangeSet(handle) {
    this.timer = undefined;
    this.shouldProcess = [];
    this.shouldNotProcess = [];
    var self = this;
    this.process = _.debounce(function () {
        handle(self.shouldProcess)
    }, 100);
}

var cSp = ChangeSet.prototype;
cSp.push = function (fileInfo) {
    if (fileInfo.match) {
        this.shouldProcess.push(fileInfo);
    } else {
        this.shouldNotProcess.push(fileInfo);
    }
};
cSp.getJSON = function () {
    return {
        shouldProcess: this.shouldProcess,
        shouldNotProcess: this.shouldNotProcess,
    };
}

module.exports.WatchSet = WatchSet;
module.exports.ChangeSet = ChangeSet;