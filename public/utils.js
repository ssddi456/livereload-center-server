// @ts-ignore
define([
    'ko',
], function (
    ko
) {

        'use strict';

        function processNames(names) {
            return names.split(/,|\s+/).map(function (name) {
                return name.trim()
            }).filter(Boolean);
        }

        return {
            processNames: processNames
        };

    });
