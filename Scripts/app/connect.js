var connectionViewModel = function (model) {
    var self = this;
    self.ServerName = ko.observable(model.ServerName).extend({ required: true });
    self.InitialCatalog = ko.observable(model.InitialCatalog).extend({ required: true });
    self.IntegratedSecurity = ko.observable(model.IntegratedSecurity);
    self.UserName = ko.observable(model.UserName).extend({ requiredIf: self.IntegratedSecurity });
    self.Password = ko.observable(model.Password).extend({ requiredIf: self.IntegratedSecurity });

    self.AccountApiKey = ko.observable(model.AccountApiKey).extend({ required: true });
    self.DatabaseApiKey = ko.observable(model.DatabaseApiKey).extend({ required: true });
}

var pageViewModel = function (options) {
    self.model = ko.validatedObservable(new connectionViewModel(options.model));

    self.testConnection = function () {
        if (!self.model.isValid()) {
            self.model.errors.showAllMessages();
            return;
        }

        app.services.call({
            url: options.testSqlUrl,
            type: 'POST',
            data: ko.toJSON(self.model())
        })
        .success(function (response) {
            if (response.Success) {
                toastr.success("Sql connection test successfull");
            }
            else {
                toastr.error(response.Message);
            }
        });

        app.services.call({
            url: options.testApiUrl,
            type: 'POST',
            data: ko.toJSON({
                account: self.model().AccountApiKey(),
                dataConnect: self.model().DatabaseApiKey()
            })
        })
        .success(function (response) {
            toastr.success("Api connection test successfull");

        });
    }

    self.saveConnection = function () {
        if (!self.model.isValid()) {
            self.model.errors.showAllMessages();
            return;
        }

        app.services.call({
            url: options.saveUrl,
            type: 'POST',
            data: ko.toJSON(self.model())
        })
        .success(function (response) {
            if (response.Success) {
                toastr.success(response.Message);
                app.goToUrlDelayed(options.continueUrl);
            }
            else {
                toastr.error(response.Message);
            }
        });
    }
}
