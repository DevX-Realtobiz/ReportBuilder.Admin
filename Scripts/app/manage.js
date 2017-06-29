var manageViewModel = function (options) {
    var self = this;

    self.saveForm = ko.validatedObservable({
        AccountApiKey: ko.observable(options.model.AccountApiKey).extend({ required: true }),
        DatabaseApiKey: ko.observable(options.model.DatabaseApiKey).extend({ required: true })
    });

    self.Tables = new tablesViewModel(options)

    self.editColumn = ko.observable();

    self.selectColumn = function (e) {
        self.editColumn(e);
    }

    self.saveChanges = function () {
        if (!self.saveForm.isValid()) {
            self.saveForm.errors.showAllMessages(true);
            toastr.error("Please enter your Api Keys in setup");
            return;
        }

        app.services.call({
            url: options.saveKeysUrl,
            type: 'POST',
            data: JSON.stringify({
                account: self.saveForm().AccountApiKey(),
                dataConnect: self.saveForm().DatabaseApiKey()
            })
        })

        var tablesToSave = $.map(self.Tables.model(), function (x) {
            if (x.Selected()) {
                return ko.mapping.toJS(x);
            }
        });

        if (tablesToSave.length == 0) {
            toastr.error("Please choose some tables and columns");
            return;
        }
        
        bootbox.confirm("Are you sure you would like to continue with saving your changes?<br><b>Note: </b>This will make changes to your account that cannot be undone.", function (r) {
            if (r) {
                $.each(tablesToSave, function (i, e) {
                    if ($.grep(e.Columns, function (x) { return x.Selected; }).length == 0) {
                        toastr.error("Cannot save table " + e.DisplayName + ", no columns selected");
                        return;
                    }

                    app.services.call({
                        url: options.saveTableUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            account: self.saveForm().AccountApiKey(),
                            dataConnect: self.saveForm().DatabaseApiKey(),
                            table: e
                        })
                    }).success(function () {
                        toastr.success("Saved table " + e.DisplayName);
                    });

                });
            }
        })
    }
}

var tablesViewModel = function (options) {
    var self = this;
    self.model = ko.mapping.fromJS(options.model.Tables);

    $.each(self.model(), function (i, t) {
        $.each(t.Columns(), function (i, e) {
            var tableMatch = $.grep(self.model(), function (x) { return x.TableName() == e.ForeignTable(); });
            e.JoinTable = ko.observable(tableMatch!=null && tableMatch.length>0? tableMatch[0]: null);
            e.JoinTable.subscribe(function (newValue) {
                e.ForeignTable(newValue.TableName());
            });
        });
    });

    self.tableFilter = ko.observable();

    self.filteredTables = ko.computed(function () {
        var filterText = self.tableFilter();
        if (filterText == null || filterText == '') {
            return self.model();
        }

        return $.grep(self.model(), function (e) {
            return e.TableName().toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
        })
    })

    self.clearTableFilter = function () {
        self.tableFilter('');
    }

    self.selectAll = function () {
        $.each(self.model(), function (i, e) {
            if (!e.Selected()) {
                e.Selected(true);
                $.each(e.Columns(), function (j, c) {
                    c.Selected(true);
                });
            }
        });
    }

    self.unselectAll = function () {
        $.each(self.model(), function (i, e) {
            e.Selected(false);
            $.each(e.Columns(), function (j, c) {
                c.Selected(false);
            });
        });
    }

    self.selectAllColumns = function (e) {
        $.each(e.Columns(), function (j, c) {
            c.Selected(true);
        });
    }

    self.unselectAllColumns = function (e) {
        $.each(e.Columns(), function (j, c) {
            c.Selected(false);
        });
    }

    self.columnSorted = function (args) {       
        $.each(args.targetParent(), function (i, e) {
            e.DisplayOrder(i);            
        });

    }
}
