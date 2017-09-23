define([
    'ko',
], function (
    ko
) {
        'use strict';

        var vm = {
            watchSets: ko.observableArray([]),

            addInfo: {
                root: ko.observable(''),
                includes: ko.observable(''),
                excludes: ko.observable(''),
            },

            addWatchSet: function () {
                addWatchSet({
                    root: this.addInfo.root,
                    includes: processNames(this.addInfo.includes()),
                    excludes: processNames(this.addInfo.excludes()),
                });
            }
        };

        function processNames(names) {
            return names.split(/,|\s+/).map(function (name) {
                return name.trim()
            }).filter(Boolean);
        }

        function WatchSet(id, data) {
            data.id = id || data.id;

            data.isWatching = ko.observable(data.isWatching);
            data.root = ko.observable(data.root);
            data.includes = ko.observable(data.includes);
            data.excludes = ko.observable(data.excludes);
            data.lastFiveChangeSet = ko.observable(data.lastFiveChangeSet);

            data.update = function (data) {
                this.isWatching(data.isWatching);
                this.root(data.root);
                this.includes(data.includes);
                this.excludes(data.excludes);
                this.lastFiveChangeSet(data.lastFiveChangeSet);
            };
            var timer;
            data.watch = function () {
                $.post('/watch_set/' + this.id + '/watch', function () {
                    load();
                    data.isWatching(true);
                })
            };

            data.stop = function () {
                clearTimeout(timer);
                timer = undefined;
                $.post('/watch_set/' + this.id + '/stop', function () {
                    data.isWatching(false);
                });
            };

            data.remove = function () {
                clearTimeout(timer);
                timer = undefined;
                $.post('/watch_set/' + this.id + '/remove', function () {
                    data.isWatching(false);
                });
            };

            function load() {
                loadWatchSet(data);
                timer = setTimeout(load, 3000);
            }

            if(data.isWatching()) {
                load();
            }
            return data;
        }


        $.getJSON('/watch_set/list', function (data) {
            var watchSets = data.watchSets;
            console.log(watchSets);
            watchSets.forEach(function (watchSet) {
                vm.watchSets.push(WatchSet(null, watchSet));
            })
        });

        function addWatchSet(data) {
            $.post('/watch_set/create', data, function (data) {
                if (!data.err) {
                    vm.watchSets.unshift(WatchSet(data.id, data.watchSet));
                }
            }, 'json');
        }

        function loadWatchSet(watchSet) {
            $.getJSON('/watch_set/' + watchSet.id, function (data) {
                if (!data.err) {
                    watchSet.update(data.watchSet);
                }
            });
        }

        ko.applyBindings(vm);
    });