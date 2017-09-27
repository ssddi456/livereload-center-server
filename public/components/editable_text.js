define([
    'ko'
], function (
    ko
) {
        ko.components.register('editable-text', {
            viewModel: function (params) {
                this.value = params.value;
                this.editing = ko.observable(false);
                this.save = function () {
                    this.editing(false);
                };
                this.edit = function () {
                    this.editing(true);
                }
            },
            template:
            [
                '<!-- ko if: editing-->',
                '    <div class="input-group">',
                '        <input type="text" data-bind="value:value" class="form-control"/>',
                '        <div class="input-group-btn">',
                '            <div data-bind="click:save" class="btn btn-default">save</div>',
                '        </div>',
                '    </div>',
                '<!-- /ko-->',
                '<!-- ko ifnot: editing-->',
                '    <div class="input-group">',
                '        <span data-bind="text:value" class="form-control editable-text-span"></span>',
                '        <div class="input-group-btn editable-text-btn">',
                '            <div data-bind="click:edit" class="btn btn-default">',
                '                <i class="glyphicon glyphicon-edit"></i>',
                '            </div>',
                '        </div>',
                '    </div>',
                '<!-- /ko-->',
            ].join('')
        })

    });
