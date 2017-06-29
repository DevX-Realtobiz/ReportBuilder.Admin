var app = {
    constants: {},
    utilities: {
        watchUserSession: function (url) {
            var idleTime = 0;
            var firstPing = true;
            //Increment the idle time counter every minute.
            var idleInterval = setInterval(function () {
                idleTime = idleTime + 1;
                if (idleTime == 1 && !firstPing) {
                    app.services.call({ url: url, uiBlocker: { start: function () { }, stop: function () { } } });
                } else {
                    firstPing = false;
                }
                if (idleTime > 14) { // 15 minutes
                    window.location.reload();
                }
            }, 60000); // 1 minute

            //Zero the idle timer on user action.
            $(document).mousemove(function (e) {
                idleTime = 0;
            }).keypress(function (e) {
                idleTime = 0;
            });
        },
        scrollTo: function (top, speed) {
            $('html, body').animate({
                scrollTop: top || 0
            }, speed || 1000);
        },
        checkForAuthenticationFailure: function (data) {
            if (data && data.unauthroized)
                location.reload(true);
        },
        createDelayedUIBlocker: function (delayTime) {
            var delayManager = function () {
                var timeout;

                this.start = function () {
                    timeout = setTimeout(function () {
                        $.blockUI({ baseZ: 2000 });
                    }, delayTime || 1000);

                    return this;
                }.bind(this);

                this.stop = function () {
                    if (timeout) {
                        clearTimeout(timeout);
                        $.unblockUI();
                    }
                    return this;
                }.bind(this);

                return this;
            };

            return new delayManager();
        },
        addFormEnterKeyPress: function (form, work) {
            return form.keypress(function (e) {
                if (e.keyCode == 13) typeof work === 'function' ? work() : form.submit();
                return !(e.keyCode == 13);
            });
        },
        getQueryStrings: function () {
            // http://stackoverflow.com/questions/2907482/how-to-get-the-query-string-by-javascript
            var assoc = {};
            var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
            var queryString = location.search.substring(1);
            var keyValues = queryString.split('&');

            for (var i in keyValues) {
                var key = keyValues[i].split('=');
                if (key.length > 1) {
                    assoc[decode(key[0])] = decode(key[1]);
                }
            }
            return assoc;
        }
    },
    viewModels: {},
    services: {
        uploadFile: function (options) {
            var uiBlocker = options.uiBlocker || app.utilities.createDelayedUIBlocker();
            var isBusy = typeof options.busy === "function" ? options.busy : function () { };

            var success = function (xhRequest) {
                if (typeof options.success === 'function') {
                    options.success(xhRequest);
                }
            };
            var error = function (xhRequest) {
                if (typeof options.error === 'function') {
                    options.error(xhRequest);
                } else {
                    if (xhRequest.status == 409) {
                        toastr.error('Conflict detected. Please ensure the record is not a duplicate and that it has no related records.');
                    } else if (xhRequest.status == 400) {
                        toastr.error('Validation failed for your request. Please make sure the data provided is correct.');
                    } else if (xhRequest.status == 401) {
                        toastr.error('You are not authorized to make that request.');
                    } else if (xhRequest.status == 403) {
                        location.reload(true);
                    } else if (xhRequest.status == 404) {
                        toastr.error('Record not found.');
                    } else if (xhRequest.status == 500) {
                        toastr.error('The system was unable to complete your request.');
                    } else {
                        toastr.error(xhRequest.status + ': The system was unable to complete your request.');
                    }
                }
            };
            var xhr = new XMLHttpRequest();
            uiBlocker.start();
            isBusy(true);

            xhr.open('POST', options.url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    uiBlocker.stop();
                    isBusy(false);

                    if (xhr.status == 200) {
                        success(xhr);
                    } else {
                        error(xhr);
                    }

                    delete success;
                    delete error;
                    delete isBusy;
                    delete uiBlocker;
                    delete options;
                    xhr.onreadystatechange = null;
                    xhr = null;
                }
            };
            xhr.send(options.formData);
        },
        call: function (options) {
            var uiBlocker = options.uiBlocker || app.utilities.createDelayedUIBlocker();
            uiBlocker.start();
            var isBusy = typeof options.busy === "function" ? options.busy : function () { };
            isBusy(true);

            return $.ajax({
                url: options.url,
                type: options.type || 'GET',
                data: options.data,
                cache: options.cache || false,
                contentType: options.contentType || 'application/json; charset=utf-8',
                headers: options.headers || {}
            }).success(function (data) {
                uiBlocker.stop();
                isBusy(false);
                app.utilities.checkForAuthenticationFailure(data);
                delete isBusy;
                delete uiBlocker;
                delete options;
            }).fail(function (jqxhr, status, error) {
                uiBlocker.stop();
                isBusy(false);

                delete isBusy;
                delete uiBlocker;
                delete options;

                if (jqxhr.responseJSON != null && jqxhr.responseJSON.Message != null) {
                    toastr.error(jqxhr.responseJSON.Message);
                    return;
                }

                if (error == 'Conflict') {
                    toastr.error('Conflict detected. Please ensure the record is not a duplicate and that it has no related records.');
                } else if (error == 'Bad Request') {
                    toastr.error('Validation failed for your request. Please make sure the data provided is correct.');
                } else if (error == 'Unauthorized') {
                    toastr.error('You are not authorized to make that request.');
                } else if (error == 'Forbidden') {
                    location.reload(true);
                } else if (error == 'Not Found') {
                    toastr.error('Record not found.');
                } else if (error == 'Internal Server Error') {
                    toastr.error('The system was unable to complete your request.');
                } else {
                    toastr.error(status + ': ' + error);
                }
            });
        }
    },
    goToUrl: function (url) {
        app.utilities.createDelayedUIBlocker().start();
        window.location.href = url;
    },
    goToUrlDelayed: function (url, delay) {
        setTimeout(function () {
            app.goToUrl(url);
        }, delay || 1000);
    },
    yesNoObservable: (function () {
        function stringToBoolean(value) {
            if (value != "no" && value != "yes") throw ('The accepted values are "yes","no"');
            return value === "yes";
        }

        return function (initialValue) {
            var result = ko.observable(initialValue);

            result.string = ko.dependentObservable({
                read: function () {
                    return result() ? 'yes' : 'no';
                },
                write: function (value) {
                    result(stringToBoolean(value));
                }
            });
            return result;
        };
    })(),
};

Number.prototype.formatCurrency = function (n, x) {
    // Courtesy: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return '$' + this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

