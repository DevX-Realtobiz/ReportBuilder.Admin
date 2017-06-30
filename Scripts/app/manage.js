var manageViewModel = function (options) {
    var self = this;

    self.saveForm = ko.validatedObservable({
        AccountApiKey: ko.observable(options.model.AccountApiKey).extend({ required: true }),
        DatabaseApiKey: ko.observable(options.model.DatabaseApiKey).extend({ required: true })
    });

    self.Tables = new tablesViewModel(options)
    self.Joins = ko.observableArray([]);
    self.JoinTypes = ["INNER", "LEFT", "LEFT OUTER", "RIGHT", "RIGHT OUTER"];

    self.editColumn = ko.observable();

    self.selectColumn = function (e) {
        self.editColumn(e);
    }

    self.setupJoin = function (item) {
        item.JoinTable = ko.observable();
        item.OtherTable = ko.observable();
        item.originalField = item.FieldName;
        item.originalJoinField = item.JoinFieldName;

        item = ko.mapping.fromJS(item);

        item.OtherTables = ko.computed(function () {
            return $.map(self.Tables.model(), function (subitem) {

                return ((item.JoinTable() != null && subitem.Id() == item.JoinTable().Id()) || subitem.Id() <= 0) ? null : subitem;
                
            });
        });

        item.OtherTable.subscribe(function (subitem) {
            //subitem.loadFields().done(function () {
                item.FieldName(item.originalField());
                item.JoinFieldName(item.originalJoinField());
            //}); // Make sure fields are loaded
        })

        item.JoinTable.subscribe(function (subitem) {
            //subitem.loadFields().done(function () {
                item.FieldName(item.originalField());
                item.JoinFieldName(item.originalJoinField());
            //}); // Make sure fields are loaded
        })

        item.DeleteJoin = function () {
            bootbox.confirm("Are you sure you would like to delete this Join?", function (r) {
                if (r) {
                    self.Joins.remove(item);
                }
            });
        };

        return item;
    };

    self.LoadJoins = function () {
        // Load and setup Relations

        app.services.call({
            url: options.getRelationsUrl,
            type: 'POST',
            data: JSON.stringify({
                account: self.saveForm().AccountApiKey(),
                dataConnect: self.saveForm().DatabaseApiKey()
            })
        }).done(function (result) {
            self.Joins($.map(result, function (item) {

                return self.setupJoin(item);
            }));

            setTimeout(function () {
                // Reset values to inital ones after loading dropdown, as it's setting them to first value
                $.each(self.Joins(), function (idx, item) {
                    item.JoinTable($.grep(self.Tables(), function (x) { return x.Id() == result[idx].TableId; })[0]);
                    item.OtherTable($.grep(item.OtherTables(), function (x) { return x.Id() == result[idx].JoinedTableId; })[0]);
                    item.FieldName(result[idx].FieldName);
                    item.JoinFieldName(result[idx].JoinFieldName);
                    item.JoinType(result[idx].JoinType);
                });
            }, 500);
        });
        
    };

    self.AddJoin = function () {
        self.Joins.push(self.setupJoin({
            TableId : 0,
            JoinedTableId: 0,
            JoinType: "INNER",
            FieldName: "",
            JoinFieldName: ""
        }));
    };

    self.SaveJoins = function () {

        $("#form-joins").validate().showErrors();

        if (!$("#form-joins").valid()) {
            return false;
        }

        $.each(self.Joins(), function () {            
            this.TableId(this.JoinTable().Id());
            this.JoinedTableId(this.OtherTable().Id());
        });

        app.services.call({
            url: options.saveRelationsUrl,
            type: 'POST',
            data: JSON.stringify({
                account: self.saveForm().AccountApiKey(),
                dataConnect: self.saveForm().DatabaseApiKey(),
                relations: ko.mapping.toJS(self.Joins)
            })
        }).done(function (result) {
            if (result == "Success") toastr.success("Changes saved successfully.");
        });
    };


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
                    }).done(function () {
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

        t.availableColumns = ko.computed(function () {
            return $.grep(t.Columns(), function (e) {
                return e.Id() > 0 && e.Selected();
            });
        });

        $.each(t.Columns(), function (i, e) {
            var tableMatch = $.grep(self.model(), function (x) { return x.TableName() == e.ForeignTable(); });
            e.JoinTable = ko.observable(tableMatch!=null && tableMatch.length>0? tableMatch[0]: null);
            e.JoinTable.subscribe(function (newValue) {
                e.ForeignTable(newValue.TableName());
            });
        });
        
    });

    self.availableTables = ko.computed(function () {
        return $.grep(self.model(), function (e) {
            return e.Id() > 0 && e.Selected();
        });
    })

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
