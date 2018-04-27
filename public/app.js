// @ts-ignore
define([
    'ko',
    './utils',
    './components/index'
], function (
    ko,
    utils,
    _components
) {
        'use strict';
        var vm = {
            watchSets: ko.observableArray([]),
            watchSet: ko.observable(),
            tab: ko.observable('options'),
            addInfo: {
                root: ko.observable(''),
                includes: ko.observable(''),
                excludes: ko.observable(''),
            },

            addWatchSet: function () {
                addWatchSet({
                    root: this.addInfo.root,
                    includes: utils.processNames(this.addInfo.includes()),
                    excludes: utils.processNames(this.addInfo.excludes()),
                });
            }
        };

        function WatchSet(id, data) {
            data.id = id || data.id;

            data.isWatching = ko.observable(data.isWatching);
            data.root = ko.observable(data.root);
            data.lastFiveChangeSet = ko.observable(data.lastFiveChangeSet);

            data.includes = ko.observable(data.includes.join(', '));
            data.excludes = ko.observable(data.excludes.join(', '));
            data.deployApi = ko.observable(data.deployApi);
            data.deployPath = ko.observable(data.deployPath);

            data.deployTestInfo = ko.observable('');
            data.deployTestStatus = ko.observable(0);

            var shouldSendUpdate = true;
            function saveOnChange() {
                if (!shouldSendUpdate) {
                    return;
                }

                $.post('/watch_set/' + data.id + '/edit',
                    data.getJSON(),
                    function () {
                        // so i should add a toast here?
                    });
            }

            data.includes.subscribe(saveOnChange);
            data.excludes.subscribe(saveOnChange);
            data.deployApi.subscribe(saveOnChange);
            data.deployPath.subscribe(saveOnChange);

            data.update = function (data) {
                shouldSendUpdate = false;
                this.isWatching(data.isWatching);
                this.root(data.root);
                this.includes(data.includes.join(', '));
                this.excludes(data.excludes.join(', '));
                this.lastFiveChangeSet(data.lastFiveChangeSet);
                this.deployApi(data.deployApi);
                this.deployPath(data.deployPath);
                shouldSendUpdate = true;
            };
            data.getJSON = function () {
                return {
                    includes: utils.processNames(this.includes()),
                    excludes: utils.processNames(this.excludes()),
                    deployApi: this.deployApi(),
                    deployPath: this.deployPath(),
                }
            }
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
            data.testDeploy = function (vm, e) {
                var btn = $(e.target);
                var self = this;
                btn
                    .removeClass('btn-success')
                    .removeClass('btn-danger')
                    .removeClass('btn-default');
                $.post('/watch_set/' + this.id + '/test_deploy', function (data) {
                    if (data.err == 0) {
                        btn.addClass('btn-success');
                        self.deployTestStatus(1);
                        self.deployTestInfo('seems ok');
                    } else {
                        btn.addClass('btn-danger');
                        self.deployTestStatus(2);
                        self.deployTestInfo(data.message);
                    }
                }).fail(function (e) {
                    btn.addClass('btn-danger');
                    self.deployTestStatus(2);
                    self.deployTestInfo('[' + e.status + '] ' + e.responseText || e.statusText);
                });
            };

            function load() {
                loadWatchSet(data);
                timer = setTimeout(load, 3000);
            }

            if (data.isWatching()) {
                load();
            }
            return data;
        }


        $.getJSON('/watch_set/list', function (data) {
            var watchSets = data.watchSets;
            console.log(watchSets);
            watchSets = watchSets.map(function (watchSet) {
                var newWatchSet = WatchSet(null, watchSet);
                vm.watchSets.push(newWatchSet);
                return newWatchSet;
            });
            if (!vm.watchSet() && watchSets.length) {
                vm.watchSet(watchSets[0]);
            }
        });

        function addWatchSet(data) {
            $.post('/watch_set/create', data, function (data) {
                if (!data.err) {
                    var newWatchSet = WatchSet(data.id, data.watchSet);
                    vm.watchSets.unshift(newWatchSet);
                    if (!vm.watchSet()) {
                        vm.watchSet(newWatchSet);
                    }
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
